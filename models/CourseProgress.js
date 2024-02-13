const mongoose = require('mongoose');

courseProgressSchema = new mongoose.Schema({
    courseId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'Course' 
    } ,
    userId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'User' 
    } ,
    progressPercentage : {
        type : Number ,
    } ,
    completedVideos : [
        {
            type : mongoose.Schema.Types.ObjectId ,
            ref : 'SubSection'
        }
    ]
});


module.exports = mongoose.model('CourseProgress' , courseProgressSchema);