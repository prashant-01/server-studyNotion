const mongoose = require('mongoose');

courseSchema = new mongoose.Schema({
    courseName : {
        type : String ,
    } ,
    courseDescription : {
        type : String ,
    } ,
    price : {
        type : String ,
    } ,
    thumbnail : {
        type : String ,
    } ,
    totalDuration : {
        type : String ,
    } ,
    whatYouWillLearn : {
        type : String ,
    } ,
    category : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'Category' ,
    } ,
    tag : [
        {
            type : String ,
        }
    ] ,
    instructor : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'User' ,
    } ,
    courseContent : [
        {
            type : mongoose.Schema.Types.ObjectId ,
            ref : 'Section' ,
        }
    ] ,
    ratingAndReviews : [
        {
            type : mongoose.Schema.Types.ObjectId ,
            ref : 'RatingAndReview' ,
        }
    ] ,
    studentsEnrolled : [
        {
            type : mongoose.Schema.Types.ObjectId ,
            ref : 'User' ,
        }
    ] ,
    instructions : [
        {
            type : String ,
        }
    ],
    status : {
        type :  String ,
        default : 'Draft' ,
        enum : [ 'Draft' , 'Approval Pending' , 'Published' ] ,
    } ,
    createdAt : {
        type : Date ,
        default : Date.now(),
    } 
});

module.exports = mongoose.model('Course' , courseSchema);