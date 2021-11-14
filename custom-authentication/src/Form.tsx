import React, {SetStateAction, useState} from "react";
import {Auth} from "aws-amplify";

type FormType =
    'signIn'|
    'confirmSignUp'|
    'forgotPasswordSubmit'

type FormInput ={
    username:string;
    password:string;
    email:string;
    confirmationCode:string;
}

type CognitoUserInfo = {
    username: string,
    email: string,
    phone_number: string,
    [key: string]: string
}

type SingIn = {
    formInputs:Pick<FormInput,'username'|'password'>
    setUser: React.Dispatch<React.SetStateAction<CognitoUserInfo>>
}

type SingUp = {
    formInputs:Pick<FormInput,'username'|'password'|'email'>
    updateFormType: React.Dispatch<React.SetStateAction<FormType>>
}

type ConfirmSignUp = {
    formInputs:Pick<FormInput,'username'|'confirmationCode'>
    updateFormType: React.Dispatch<React.SetStateAction<FormType>>
}

type ForgotPassword = {
    formInputs:Pick<FormInput,'username'>
    updateFormType: React.Dispatch<React.SetStateAction<FormType>>
}

type ForgotPasswordSubmit = {
    formInputs:Pick<FormInput,'username'|'confirmationCode'|'password'>
    updateFormType: React.Dispatch<React.SetStateAction<FormType>>
}

const signIn = async ({formInputs,setUser}:SingIn)=>{
    try {
        const user = await Auth.signIn({
            username:formInputs.username,
            password:formInputs.password,
        })
        const userInfo = {username:user.username,...user.attributes}
        console.log('sign in success');
        setUser(userInfo)
    }catch (err){
        console.log('error signing in..',err)
    }
}

const signUp = async ({formInputs,updateFormType}:SingUp)=>{
    try {
        await Auth.signUp({
            username:formInputs.username,
            password:formInputs.password,
            attributes:{email:formInputs.email}
        })
        console.log('sign up success');
        updateFormType('confirmSignUp')
    }catch (err){
        console.log('error signing up..',err)
    }
}

const confirmSignUp = async ({formInputs,updateFormType}:ConfirmSignUp)=>{
    try {
        await Auth.confirmSignUp(formInputs.username,formInputs.confirmationCode)
        updateFormType('signIn')
    }catch (err){
        console.log('error signing up..',err)
    }
}

const forgotPassword = async ({formInputs,updateFormType}:ForgotPassword)=>{
    try {
        await Auth.forgotPassword(formInputs.username)
        updateFormType('forgotPasswordSubmit')
    }catch (err){
        console.log('error submitting username to reset password...',err)
    }
}

const forgotPasswordSubmit = async ({formInputs,updateFormType}:ForgotPasswordSubmit)=>{
    try {
        await Auth.forgotPasswordSubmit(formInputs.username,formInputs.confirmationCode,formInputs.password)
        updateFormType('signIn')
    }catch (err){
        console.log('error updating password...',err)
    }
}

const initialFormState = {
    username:'',
    password:'',
    email:'',
    confirmationCode:''
}

const styles = {
    container:{
        display:'flex',
        flexDirection:'column'as const,
        marginTop:30,
        justifyContent:'center',
        alignItems:'center'
    },
    input:{
        height:45,
        marginTop:8,
        width:300,
        maxWidth:300,
        padding:'0px 8px',
        fontSize:16,
        outline:'none',
        border:'none',
        borderBottom:'2px solid rgba(0,0,0,.3)'
    },
    toggleForm:{
        fontWeight:600,
        padding:'0px 25px',
        marginTop:15,
        marginBottom:0,
        textAlign:'center',
        color:'rgba(0,0,0,0.6)'
    },
    resetPassword:{
        marginTop:5,
    },
    anchor:{
        color:'#006bfc',
        cursor:'pointer',
    }
}

const Form:React.FC = (props)=>{
    const [formType,updateFormType] = useState<FormType>('signIn');
    const [formState,updateFormState] = useState(initialFormState);
    const renderForm = ()=>{
        return "hoge"
    }
    return(
        <div>
            {renderForm()}
        </div>
    )
}

export {styles,Form}