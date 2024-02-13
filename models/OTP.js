const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');

otpSchema = new mongoose.Schema({
    email : {
        type : String ,
        required : true
    } ,
    otp : {
        type : String ,
        required : true
    } ,
    createdAt : {
        type : Date ,
        default : Date.now(),
        expires : '10m' ,
    } ,
});

async function sendVerificationMail( email , otp ){
    try{
        const mailResponse = await mailSender( email , 'Verification Email from StudyNotion' , `Your OTP to Sign up is - ${otp}`);
        console.log('Email sent Successfully :' , mailResponse);
    }catch(error){
        console.log('Error occured while sending OTP mail' , error.message);
    }
}

otpSchema.pre('save' , async function(next){
    /* here 'this' refers to the document of the type OTP schema */
    await sendVerificationMail( this.email , this.otp );
    next();
});

module.exports = mongoose.model('OTP' , otpSchema);