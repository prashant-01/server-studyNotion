const Course = require('../models/Course');
const User = require('../models/User');
const Category = require('../models/Category');
const SubSection = require('../models/SubSection');
const Section = require('../models/Section');
const uploadImageToCloudinary  = require('../utils/fileUploader');
const deleteFileFromCloudinary = require('../utils/fileDelete');
const dotenv = require('dotenv');
const CourseProgress = require('../models/CourseProgress');
dotenv.config();

const createCourse = async ( req , res ) => {
    try{
        /* get data */
        const { 
            courseName , 
            courseDescription , 
            whatYouWillLearn , 
            price , 
            category , 
            tag , 
            instructions } = req.body;

        /* get thumbnail */
        const thumbnail = req.files.thumbnail ;
        /* validation of data */

        if( courseName===null || courseDescription===null || whatYouWillLearn===null || price===null || category===null || thumbnail===null ){
            return res.status(403).json({
                success : false ,
                message : 'All required fields must be filled'
            });
        }
        
        /* converting tag string to array */
        let tagArray = [] ;
        if(tag){
            tagArray = tag.split(',');
        }

        /* converting instructions string to array */
        let instructionsArray = [] ;
        if( instructions ){
            instructionsArray = instructions.split(',');
        }
        /* get instructor id */
        const instructorID = req.user.id;

        /* check given category is valid or not */

        const categoryDetails = await Category.findById( category );
        if(!categoryDetails){
            return res.status(403).json({
                success : false ,
                message : 'Invalid Tag Token'
            });
        }

        /* upload image to cloudinary */
        const thumbnailImage = await uploadImageToCloudinary( thumbnail , process.env.CLOUDINARY_FOLDER_NAME_THUMBNAILS );
        if( !thumbnailImage ){
            return res.status(403).json({
                success : false ,
                message : 'Error in Upload to cloudinary'
            })
        }
        /* create an entry for new course */
        const newCourse = await Course.create({
            courseName ,
            courseDescription ,
            price ,
            whatYouWillLearn ,
            tag : tagArray,
            thumbnail : thumbnailImage.secure_url ,
            category : categoryDetails._id ,
            instructor : instructorID ,
            instructions : instructionsArray
        });

        /* push new created course id to the User schema courses array */
        const filter = { _id : instructorID };
        const update = {
            $push : {
                courses : newCourse._id
            }
        };

        const updatedUser = await User.findOneAndUpdate( filter , update , { new : true } );
        if(!updatedUser){
            return res.status(403).json({
                success : false ,
                message : 'Error in updating course in Instructor Schema'
            });
        }

        /* push new created course id to the Category schema courses array */
        const filter1 = { _id : categoryDetails._id };
        const update1 = {
            $push : {
                courses : newCourse._id
            }
        };
        
        const updatedCategory = await Category.findOneAndUpdate( filter1 , update1 , { new : true } );
        if(!updatedCategory){
            return res.status(403).json({
                success : false ,
                message : 'Error in updating course in Category Schema'
            });
        }

        /* return response */
        return res.status(200).json({
            success : true ,
            data : newCourse ,
            message : 'Course created successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message 
        });
    }
}

const editCourse = async ( req , res ) => {
    try{
        let thumbnail = null;
        let thumbnailImage = null ;
        if( req.files === null ){
            // It means thumbnail has not been updated , the previous thumbnail will come inside body bcoz it's a string not a file
            thumbnail = req.body.thumbnail;
        } 
        else{
            /* upload new updated image to cloudinary */
            thumbnail = req.files.thumbnail;
            thumbnailImage = await uploadImageToCloudinary( thumbnail , process.env.CLOUDINARY_FOLDER_NAME_THUMBNAILS );
            if( !thumbnailImage ){
                return res.status(403).json({
                    success : false ,
                    message : 'Error in Upload to cloudinary'
                })
            }
        }
        const { 
            courseId ,
            courseName , 
            courseDescription , 
            whatYouWillLearn , 
            price , 
            category , 
            tag , 
            instructions ,
            status='Draft' ,
        } = req.body;

        console.log( courseName , 
            courseDescription , 
            whatYouWillLearn , 
            price , 
            category , 
            tag , 
            instructions ,
            status   );
        /* converting tag string to array */
        let tagArray = [] ;
        if(tag){
            tagArray = tag.split(',');
        }

        /* converting instructions string to array */
        let instructionsArray = [] ;
        if( instructions ){
            instructionsArray = instructions.split(',');
        }

        const updatedCourse = await Course.findByIdAndUpdate( { _id : courseId } ,{ 
            courseName : courseName , 
            courseDescription : courseDescription, 
            whatYouWillLearn : whatYouWillLearn , 
            thumbnail : thumbnailImage ?  thumbnailImage.secure_url : thumbnail ,
            price : price, 
            category : category , 
            tag : tagArray, 
            instructions : instructionsArray ,
            status : status ,
            } , { new : true })
            .populate([
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

        if( !updatedCourse ){
            res.status(403).json({
                success : false ,
                message : 'Error in updating course'
            })
        }
        res.status(200).json({
            success : true ,
            data : updatedCourse ,
            message : 'Course Updated Successfully'
        })
    }catch( error ){
        res.status(403).json({
            success : false ,
            message : error.message
        })
    }
}

const getPublishedCourses = async ( req , res ) => {
    try{
        const allCourses = await Course.find({ status : 'Published' } , {
            courseName : true ,
            price : true ,
            thumbnail : true ,
            instructor : true ,
            tag : true ,
            ratingAndReviews : true ,
            studentsEnrolled : true
        }).populate([
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
        return res.status(200).json({
            success : true ,
            data : allCourses ,
            message : 'All Courses recieved successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        })
    }
}

const updateCourseStatus = async ( req , res ) => {
    try{
        const { courseId , status } = req.body;
        const updatedCourseDetails = await Course.findByIdAndUpdate( { _id : courseId } , {
            status : status 
        } , { new : true } )
        if( updatedCourseDetails ){
            return res.status(200).json({
                success : true ,
                updatedCourseDetails ,
                message : "Successfully updated course status"
            });
        }
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error
        })
    }
}

const getCourseDetails = async ( req , res ) => {
    try { 
        const courseId = req.params.courseId ;
        if( !courseId ){
            return res.status(403).json({
                success : false ,
                message : 'Invalid courseId'
            });
        }

        const courseDetails = await Course.findById( courseId )
        .populate([{
            path : 'courseContent' ,
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

        

        if( !courseDetails ){
            return res.status(403).json({
                success : false ,
                message : 'Course not found'
            });
        }

        // let totalDurationInSeconds = 0 ;
        // courseDetails.courseContent.forEach( (section) => {
        //     section.subSection.forEach( (subSection) => {
        //         const timeDurationInSeconds = parseInt( subSection.timeDuration );
        //         totalDurationInSeconds += timeDurationInSeconds;
        //     } ) 
        // } )
        // const totalDuration = convertSecondsToDuration( totalDurationInSeconds );

        return res.status(200).json({
            success : true ,
            data : courseDetails ,
            message : 'Fetched course details'
        })
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

const getCourseDetailsWithDuration = async ( req , res ) => {
    try { 
        const courseId = req.params.courseId ;
        if( !courseId ){
            return res.status(403).json({
                success : false ,
                message : 'Invalid courseId'
            });
        }

        const courseDetails = await Course.findById( courseId )
        .populate([{
            path : 'courseContent' ,
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

        

        if( !courseDetails ){
            return res.status(403).json({
                success : false ,
                message : 'Course not found'
            });
        }

        // calculate totalDuration
        let totalDurationInSeconds = 0 ;
        courseDetails.courseContent.forEach( (section) => {
            section.subSection.forEach( (subSection) => {
                const timeDurationInSeconds = parseInt( subSection.timeDuration );
                totalDurationInSeconds += timeDurationInSeconds;
            } ) 
        } )
        const totalDuration = convertSecondsToDuration( totalDurationInSeconds );

        // find course and update totalDuration in it
        const updatedCourseDetails = await Course.findByIdAndUpdate( { _id : courseId } , {
            totalDuration : totalDuration
        } , { new : true })
        .populate([{
            path : 'courseContent' ,
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

        return res.status(200).json({
            success : true ,
            data : updatedCourseDetails ,
            message : 'Fetched course details'
        })
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

function calculateTotalDuration( course ){
    let totalDurationInSeconds = 0 ;
    course.forEach( (section) => {
        section.subSection.forEach( (subSection) => {
            const timeDurationInSeconds = parseInt( subSection.timeDuration );
            totalDurationInSeconds += timeDurationInSeconds;
        } ) 
    } )
    const totalDuration = convertSecondsToDuration( totalDurationInSeconds );
    return totalDuration;
}

const getFullCourseDetails = async ( req , res ) => {
    try{
        const courseId = req.params.courseId ;
        const userId = req.user.id ;
        const courseDetails = await Course.findOne({ _id :  courseId })
            .populate([
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
        if( !courseDetails ){
            return res.status(403).json({
                success : false ,
                message : 'Could not find course'
            })
        }
        let courseProgressCount = await CourseProgress.findOne({
            courseId : courseId ,
            userId : userId 
        })

        const totalDuration = calculateTotalDuration( courseDetails.courseContent );
        
        return res.status(200).json({
            success : true ,
            data : {
                courseDetails ,
                totalDuration ,
                completedVideos : courseProgressCount.completedVideos ? courseProgressCount.completedVideos
                : [] ,
            }
        })
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message 
        })
    }
}

const getInstructorCourses = async ( req , res ) => {
    try{
        const instructorId = req.user.id ;
        const instructorCourses = await Course.find({
            instructor : instructorId
        }).sort( {  createdAt : -1 } )
        .populate([
            {
                path : 'courseContent' ,
                model : 'Section' ,
                populate : {
                    path : 'subSection' ,
                    model : 'SubSection'
                }
            }
        ]).exec();

        if(!instructorCourses){
            return res.status(403).json({
                success : false ,
                message : 'Could not fetch instructor courses'
            })
        }
        let totalDuration=[];
        for( let course of instructorCourses ){
            totalDuration.push(calculateTotalDuration( course.courseContent ));
        }

        return res.status( 200 ).json({
            success : true ,
            data : {
                instructorCourses : instructorCourses ,
                totalDuration : totalDuration
            } ,
            message : 'Sucessfully fetched instructor courses'
        })
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error.message 
        })
    }
}

const deleteCourse = async (req , res) => {
    try{
        const courseId = req.body.courseId ;

        // Find course
        const courseDetails = await Course.findById( courseId )
        
        // unenroll students from it;
        const studentsEnrolled = courseDetails.studentsEnrolled ;
        for(const student of studentsEnrolled){
            await User.findByIdAndUpdate({ _id : student } , {
                $pull : {
                    courses : courseId 
                }
            })
        }

        // delete sections and subsections
        const courseSections = courseDetails.courseContent ;
        for(const sectionId of courseSections){
            // get section details
            const sectionDetails = await Section.findById(sectionId);

            // now get subsectionId from section details
            const subSections = sectionDetails.subSection;
            for(const subSectionId of subSections){
                const subSectionDetails = await SubSection.findById(subSectionId);

                /* delete video of subSection from cloudinary */
                const videoUrl = subSectionDetails.videoUrl ;
                let video_id = videoUrl.split('/').pop().split('.')[0];
                await deleteFileFromCloudinary( video_id , process.env.CLOUDINARY_FOLDER_NAME_COURSE_VIDEOS , 'video');
                // delete subsection with the help of subsectionId
                await SubSection.findByIdAndDelete(subSectionId);
            }
            // finally delete that section also and move to next section
            await Section.findByIdAndDelete(sectionId)
        }

        /* delete thumbnail from cloudinary */
        let image = courseDetails.thumbnail;
        let image_id = image.split('/').pop().split('.')[0];
        await deleteFileFromCloudinary( image_id , process.env.CLOUDINARY_FOLDER_NAME_THUMBNAILS , 'image' );

        // finally delete course
        const response = await Course.findByIdAndDelete({ _id : courseId });
        if(!response){
            return res.status(403).json({
                success : false ,
                message : "Could not delete course"
            })
        }
        return res.status(200).json({
            success : true ,
            data : response ,
            message : 'Successfully deleted course'
        })
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error.message
        })
    }
}



module.exports = { 
    createCourse , 
    editCourse , 
    deleteCourse , 
    updateCourseStatus ,
    getPublishedCourses , 
    getCourseDetails , 
    getCourseDetailsWithDuration ,
    getFullCourseDetails , 
    getInstructorCourses ,
    calculateTotalDuration ,
};