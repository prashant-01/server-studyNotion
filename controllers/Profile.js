const Profile = require('../models/Profile');
const User = require('../models/User');
const Course = require('../models/Course');
const uploadImageToCloudinary = require('../utils/fileUploader');
const deleteFileFromCloudinary = require('../utils/fileDelete');
const dotenv = require('dotenv');
dotenv.config();
const CourseProgress = require('../models/CourseProgress');

const updateProfile = async ( req , res ) => {
    try{
        /* get data */
        
        const { firstName , lastName , gender , dateOfBirth , about , contactNumber } = req.body ;
        const userId = req.user.id ;

        /* validate data */
        if( !gender && !contactNumber && !dateOfBirth && !contactNumber && !userId && !firstName && !lastName){
            return res.status(403).json({
                success : false ,
                message : 'All required fields must be filled'
            });
        }

        /* find user , get profile Id and update the profile in DB */
        const user = await User.findById(userId);
        const profileDetails = await Profile.findByIdAndUpdate( { _id : user.additionalDetails } , {
            gender ,
            dateOfBirth ,
            about ,
            contactNumber
        } , { new : true });
        const userInfo = await User.findByIdAndUpdate( { _id : userId } , {
            firstName ,
            lastName
        } , { new : true }).populate( 'additionalDetails' );
        if( !profileDetails ){
            return res.status(403).json({
                success : false ,
                message : 'Error in updating user profile'
            });
        }

        /* return response */
        return res.status(200).json({
            success : true ,
            data : userInfo ,
            message : 'Profile Updated Successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

const updateProfilePicture = async ( req , res ) => {
    try{
        /* get logged in user id */
        const userId  = req.user.id;
        const picture = req.files.displayPicture ;
        if( !picture ){
            return res.status(404).json({
                success : false ,
                message : 'Picture not found'
            });
        }

        /* TODO : before uploading , must delete previous image if it is not of dicebear type , from cloudinary */
        const user = await User.findById(userId);
        let image = user.image;
        const imageType = image.split('.')[1];
        if( imageType === 'cloudinary' ){
            let image_id = image.split('/').pop().split('.')[0];
            await deleteFileFromCloudinary( image_id , process.env.CLOUDINARY_FOLDER_NAME_PROFILE_PICTURES , 'image' );
        }

        /* upload latest image to cloudinary */
        const pictureResponse = await uploadImageToCloudinary( picture , process.env.CLOUDINARY_FOLDER_NAME_PROFILE_PICTURES );
        const updatedUser = await User.findByIdAndUpdate({ _id : userId } , { 
            image : pictureResponse.secure_url
        } , { new : true }).populate( 'additionalDetails' );

        /* return response */
        res.status(200).json({
            success : true ,
            data : updatedUser ,
            message : 'Successfully updated display picture'
        });
    }catch(error){
        res.status(500).json({
            success : false ,
            message : error
        })
    }
    
}

const deleteProfilePicture = async ( req , res ) => {
    try {
        const userId = req.user.id ;
        const user = await User.findById(userId);

        /* check if profile picture is already deleted or not */
        let image = user.image;
        const imageType = image.split('.')[1];
        if( imageType === 'dicebear' ){
            return res.status(403).json({
                success : false ,
                message : 'Profile picture is already deleted'
            });
        }

        /* deleting image from Cloudinary */
        let image_id = image.split('/').pop().split('.')[0];
        deleteFileFromCloudinary( image_id , process.env.CLOUDINARY_FOLDER_NAME_PROFILE_PICTURES );
        const space = ' ';
        const updatedUser = await User.findByIdAndUpdate( { _id : userId } , { 
            image : `https://api.dicebear.com/5.x/initials/svg?seed=${ user.firstName }${ space }${ user.lastName }`
        } , { new : true });

        if(!updatedUser){
            return res.status(403).json({
                success : false ,
                message : "Error in deleting profile picture"
            });
        }
        return res.status(200).json({
            success : true ,
            data : updatedUser.image ,
            message : 'Profile picture deleted successfully'
        })
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error.message 
        });
    }
}

const deleteAccount = async ( req , res ) => {
    try{
        /* get user id */
        const userId = req.user.id ;

        /* validate id */
        const userDetails = await User.findById(userId)
        if(!userDetails){
            return res.status(403).json({
                success : false ,
                message : 'Invalid Id'
            });
        }

        /* delete profile */
        await Profile.findByIdAndDelete({ _id : userDetails.additionalDetails });
        
        /* if the User is Student - then unenroll student from all the courses in Course Schema studentsEntrolled key */
        const allCourses = await Course.find( {} );
        for( const course of allCourses ){
            if( course.studentsEnrolled.includes( userId ) ){
                try{
                    
                    await Course.findByIdAndUpdate( { _id : course._id } , {
                        $pull : {
                            'studentsEnrolled' : userId
                        }
                    });
                }catch(error){
                    return res.status(403).json({
                        success : false ,
                        message : error.message
                    })
                }
            }
        }
        
        /* if the user is Instructor - then delete all the Instructor Id from all courses */
        for( const course of allCourses ){
            if( course.instructor === userId ){
                try{
                    await Course.findByIdAndUpdate( { _id : course._id } , { instructor : null });
                }catch(error){
                    return res.status(403).json({
                        success : false ,
                        message : error.message
                    })
                }
            }
        }
        /* delete user */
        await User.findByIdAndDelete({ _id : userId });

        /* return response */
        return res.status(200).json({
            success : true ,
            message : 'Account deleted successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

const getUserDetails = async ( req , res ) => {
    try{
        const id = req.user.id ;
        const user = await User.findById(id).populate('additionalDetails').exec();
        return res.status(200).json({
            success : true ,
            data : user ,
            message : 'Fetched all users details'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

function convertSecondsToDuration( seconds ){
    let minutes = Math.floor(seconds / 60);
    let extraSeconds = seconds % 60;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    extraSeconds = extraSeconds < 10 ? "0" + extraSeconds : extraSeconds;
    return `${minutes} : ${extraSeconds}` ;
}

const getUserEnrolledCourses = async ( req , res ) => {
    try{
        const id = req.user.id ;
        const user = await User.findOne({ _id : id })
        .populate([
            {
                path : 'courses' ,
                model : 'Course' ,
                populate : {
                    path : 'courseContent' ,
                    model : 'Section' ,
                    populate : {
                        path : 'subSection' ,
                        model : 'SubSection'
                    }
                }
            }
        ]).exec();

        // calculating total duration of course and it's progress %
        let updatedCourses = [];
        const multiplier = Math.pow(10 , 2);
        for( const course of user.courses ){
            let totalDurationInSeconds = 0 ;
            let totalNoOfLectures = 0;
            for( const section of course.courseContent ){
                totalNoOfLectures += section.subSection.length ;
                for( const subSection of section.subSection ){
                    const timeDurationInSeconds = parseInt( subSection.timeDuration );
                    totalDurationInSeconds += timeDurationInSeconds;
                }
            }
            let totalDuration = convertSecondsToDuration( totalDurationInSeconds );
            
            // calculating progress %
            let courseProgress = await CourseProgress.findOne({
                courseId : course._id ,
                userId : id
            });

            if(!courseProgress){
                return res.status(403).json({
                    success : false ,
                    message : "courseProgress not found"
                })
            }

            let courseProgressCount = courseProgress.completedVideos.length;
            let progress = Math.round((courseProgressCount/totalNoOfLectures)*100*multiplier)/multiplier;

            // update progress % in CourseProgress schema
            const updatedCourseProgress = await CourseProgress.findByIdAndUpdate( { _id : courseProgress._id } , {
                progressPercentage : progress
            } , { new : true });

            // console.log('updatedCourseProgress' , updatedCourseProgress);

            // update total duration i course schema
            const courseDetail = await Course.findByIdAndUpdate( { _id : course._id } , { 
                totalDuration : totalDuration ,
            } , { new : true })
            .populate([{
                path : 'courseContent' ,
                model : 'Section' ,
                populate : {
                    path : 'subSection' ,
                    model : 'SubSection'
                }
            } , {
                path : 'category' ,
                model : 'Category' ,
                populate : {
                    path : 'courses' ,
                    model : 'Course'
                }
            } , {
                path : 'ratingAndReviews' ,
                model : 'RatingAndReview' ,
                populate : {
                    path : 'user' ,
                    model : 'User' ,
                    populate : {
                        path : 'additionalDetails' ,
                        model : 'Profile' 
                    }
                }
            } , {
                path : 'studentsEnrolled' ,
                model : 'User' ,
                populate : {
                    path : 'additionalDetails' ,
                    model : 'Profile' 
                }
            } , {
                path : 'instructor' ,
                model : 'User' ,
                populate : {
                    path : 'additionalDetails' ,
                    model : 'Profile' 
                }
            }]).exec();
            

            updatedCourses.push({ courseDetail , progressPercentage : progress });
        }
        return res.status(200).json({
            success : true ,
            data : updatedCourses ,
            message : 'Fetched all users details'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error
        });
    }
}

const instructorDashboard = async ( req , res ) => {
    try{
        const courseDetails = await Course.find( {
            instructor : req.user.id 
        } );

        const courseData = courseDetails.map( (course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length ;
            const totalAmountEarned = totalStudentsEnrolled * course.price ;

            // creating new required object to send to frontend dasboard
            const courseDataWithStats = {
                _id : course._id ,
                courseName : course.courseName ,
                courseDescription : course.courseDescription ,
                totalStudentsEnrolled ,
                totalAmountEarned
            }
            return courseDataWithStats;
        } )

        return res.status(200).json({
            success : true ,
            data : courseData ,
            message : "Fetched instructor dashboard data"
        })
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error
        })
    }
}

module.exports = { updateProfile , updateProfilePicture , deleteProfilePicture , deleteAccount , getUserDetails , getUserEnrolledCourses , instructorDashboard };