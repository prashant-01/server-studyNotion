const RatingAndReview = require('../models/RatingAndReview');
const User = require('../models/User');
const Course = require('../models/Course');

const createRatingAndReview = async ( req , res ) => {
    try{
        /* get data */
        const { rating , review } = req.body ;
        const courseId = req.params.courseId ;
        const userId = req.user.id ;

        /* validate data */
        if( !courseId || !userId ){
            return res.status(403).json({
                success : false ,
                message : 'Invalid credentials'
            });
        }

        /* check if user is enrolled in that course or not */
        const courseDetails = await Course.find({
            _id : courseId , 
            studentsEnrolled : { $elemMatch : { $eq : userId } }
        })
        if(!courseDetails){
            return res.status(404).json({
                success : false ,
                message : 'Student is not enrolled in this course'
            });
        }
        /*---Second Method---*/
        // const course = await Course.findById(courseId);
        // if( !course.studentsEnrolled.includes(userId) ){
        //     return res.status(403).json({
        //         success : false ,
        //         message : 'You are not enrolled in this course'
        //     })
        // }

        /* check if user has already made a review */
        // const alreadyReviewed = await RatingAndReview.findOne({
        //     user : userId ,
        //     course : courseId ,
        // });
        // if(alreadyReviewed){
        //     return res.status(404).json({
        //         success : false ,
        //         message : 'Student already reviewed this course'
        //     });
        // }

        /*---Second Method---*/
        // const courseRatingAndReviews = course.ratingAndReviews ;
        // if( courseRatingAndReviews.length !== 0 ){
        //     for( const ratingAndReviews of courseRatingAndReviews ){
        //         if( ratingAndReviews.user === mongoose.Types.ObjectId( userId ) ){
        //             return res.status( 403 ).json({
        //                 success : false ,
        //                 message : 'User has already made a review'
        //             });
        //         }
        //     }
        // }

        /* create rating and review */
        const newRatingAndReview = await RatingAndReview.create({
            user : userId ,
            review ,
            rating ,
            course : courseId
        });

        /* update that course with rating and review */
        const updatedCourse = await Course.findByIdAndUpdate({ _id : courseId } , {
            $push : {
                ratingAndReviews : newRatingAndReview._id
            }
        } , { new : true }).populate([
            {
                path : 'instructor' ,
                model : 'User' ,
                populate : {
                    path : 'additionalDetails' ,
                    model : 'Profile'
                }
            } ,
            {
                path : 'category' ,
                model : 'Category'
            } , 
            {
                path : 'ratingAndReviews' ,
                model : 'RatingAndReview'
            } ,
            {
                path : 'courseContent' ,
                model : 'Section' ,
                populate : {
                    path : 'subSection' ,
                    model : 'SubSection'
                }
            }
        ])
        .exec();

        /* return response */
        return res.status(200).json({
            success : true ,
            data : updatedCourse ,
            message : 'Made a review successfully'
        })
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message 
        })
    }
}

const getAverageRating = async ( req , res ) => {
    try{
        const { courseId } = req.params ;
        const result = await RatingAndReview.aggregate([
            {
                $match : { course : courseId }
            } ,
            {
                $group : {
                    _id : null ,
                    averageRating : { $avg : '$rating' }
                }
            }
        ]);

        console.log(result);
        if( result.length > 0 ){
            return res.status(200).json({
                success : true ,
                averageRating : result[0].averageRating ,
                message : 'Calculated Average of all ratings'
            });
        }

        return res.status(403).json({
            success : false ,
            message : 'Error in calculating Avg Rating'
        })
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message 
        })
    }
}

const getAllRatingAndReview = async ( req , res ) => {
    try{
        const allRatingAndReviews = await RatingAndReview.find({}).populate([
            {
                path : 'user' ,
                model : 'User' ,
                select : 'firstName lastName email image' 
            } , {
                path : 'course' ,
                model : 'Course' ,
                select : 'courseName'
            }
        ]).exec();

        if(!allRatingAndReviews){
            return res.status(403).json({
                success : false ,
                message : 'Not found Rating and reviews'
            });
        }

        return res.status(200).json({
            success : true ,
            data : allRatingAndReviews ,
            message : 'Got all rating and reviews'
        })
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message 
        })
    }
}

const isReviewMade = async ( req , res ) => {
    const courseId = req.params.courseId;
    const userId = req.user.id ;
    if( !courseId || !userId ){
        return res.status(500).json({
            success : false ,
            message : 'Invalid credentials'
        })
    }

    const response = await RatingAndReview.findOne({
        user : userId ,
        course : courseId 
    })

    if(!response){
        return res.status(403).json({
            success : false ,
            message : 'No review made'
        })
    }

    return res.status(299).json({
        success : true ,
        message : 'Review already made'
    });
}
module.exports = { createRatingAndReview , getAverageRating , getAllRatingAndReview , isReviewMade };