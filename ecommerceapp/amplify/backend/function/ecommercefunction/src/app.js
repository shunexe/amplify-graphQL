/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

/* Amplify Params - DO NOT EDIT
	AUTH_ECOMMERCEAPP7553087A_USERPOOLID
	ENV
	REGION
	STORAGE_PRODUCTTABLE_ARN
	STORAGE_PRODUCTTABLE_NAME
	STORAGE_PRODUCTTABLE_STREAMARN
Amplify Params - DO NOT EDIT */

var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const AWS = require('aws-sdk');
const {v4: uuid} = require('uuid');
const cognito = new AWS.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18',
})
const userpoolId = process.env.AUTH_ECOMMERCEAPP7553087A_USERPOOLID;
const region = process.env.REGION;
const ddb_table_name = process.env.STORAGE_PRODUCTTABLE_NAME
const docClient = new AWS.DynamoDB.DocumentClient({region});

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    next()
});

const getGroupForUser = async (event) => {
    let userSub = event
        .requestContext
        .identity
        .cognitoAuthenticationProvider
        .split(':CognitoSignIn:')[1]

    let userParams = {
        UserPoolId: userpoolId,
        Filter: `sub = "${userSub}"`
    }
    let userData = await cognito.listUsers(userParams).promise()
    const user = userData.Users[0];
    const groupParams = {
        UserPoolId: userpoolId,
        Username: user.Username
    }
    const groupData = await cognito.adminListGroupsForUser(groupParams).promise()
    console.log(groupData)
    return groupData;
}

const canPerformAction = async (event, group) => {
    return new Promise(async (resolve, reject) => {
        if (!event.requestContext.identity.cognitoAuthenticationProvider) {
            return reject();
        }

        const groupData = await getGroupForUser(event);
        console.log(groupData)
        const groupsForUser = groupData.Groups.map(group => group.GroupName)
        console.log(groupsForUser)
        if (groupsForUser.includes(group)) {
            resolve()
        } else {
            reject('user not in group,cannot perform action...')
        }
    })
}

/**********************
 * Example get method *
 **********************/

const getItems = async () => {
    const params = {TableName: ddb_table_name}
    try {
        const data = await docClient.scan(params).promise();
        return data;
    } catch (err) {
        return err;
    }
}

app.get('/products', async (req, res) => {
    try {
        const data = await getItems();
        res.json({data: data})
    } catch (err) {
        res.json({error: err});
    }
});

app.post('/products', async (req, res) => {
    const {body} = req;
    const {event} = req.apiGateway;
    try {
        await canPerformAction(event, 'Admin');
        console.log("アドミンだーーー")
        const input = {...body, id: uuid()}
        const params = {
            TableName: ddb_table_name,
            Item: input
        }
        await docClient.put(params).promise();
        const response = {
            statusCode: 200,
            message:""
        }
        res.send(response);
    } catch (err) {
        res.json({error: err});
    }
});

/****************************
 * Example delete method *
 ****************************/

app.delete('/products', async (req, res) => {
    const {event} = req.apiGateway;
    try {
        await canPerformAction(event, 'Admin')
        const params = {
            TableName: ddb_table_name,
            Key: {id: req.body.id}
        }
        await docClient.delete(params).promise();
        res.json({success: 'successfully deleted item'})
    } catch (err) {
        res.json({error: err})
    }
});

app.listen(3000, function () {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app

