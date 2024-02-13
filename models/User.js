const mongoose = require('mongoose');

userSchema = new mongoose.Schema({
    firstName : {
        type : String ,
        required : true ,
        trim : true ,
    } ,
    lastName : {
        type : String ,
        required : true ,
        trim : true ,
    } ,
    email : {
        type : String ,
        required : true ,
        trim : true ,
    } ,
    password : {
        type : String ,
        required : true ,
    } ,
    image : {
        type : String ,
        required : true 
    } ,
    token : {
        type : String
    } ,
    resetPasswordExpires : {
        type : Date 
    } ,
    accountType : {
        type : String ,
        enum : ['Student' , 'Instructor' , 'Admin'] ,
    } ,
    additionalDetails : {
        type : mongoose.Schema.Types.ObjectId ,
        required : true ,
        ref : 'Profile' 
    } , 
    courses : [
        {
            type : mongoose.Schema.Types.ObjectId ,
            ref : 'Course'
        }
    ] ,
    courseProgress : [
        {
            type : mongoose.Schema.Types.ObjectId ,
            ref : 'CourseProgress' ,
        }
    ] , 
});

module.exports = mongoose.model('User' , userSchema);