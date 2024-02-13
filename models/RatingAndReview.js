const mongoose = require('mongoose');

ratingAndReviewSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId ,
        required : true ,
        ref : 'User'
    } ,
    review : {
        type : String ,
        required : true ,
    } ,
    rating : {
        type : Number ,
        required : true ,
    } ,
    course : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'Course' ,
        required : true ,
        index : true
    }
});

module.exports = mongoose.model('RatingAndReview' , ratingAndReviewSchema);