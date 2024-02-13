const SubSection = require('../models/SubSection');
const Section = require('../models/Section');
const Course = require('../models/Course');
const uploadImageToCloudinary = require('../utils/fileUploader');
const dotenv = require('dotenv');
const deleteFileFromCloudinary = require('../utils/fileDelete');
dotenv.config();

const createSubSection = async ( req , res ) => {
    try {
        /* get data from req.body */
        const { title , timeDuration , description , courseId } = req.body ;
        const sectionId  = req.params.sectionId ;
        const videoUrl = req.files.videoUrl ;
        /* validate data */
        if( !title || !timeDuration || !description || !videoUrl ){
            return res.status(403).json({
                success : false , 
                message : 'All required fields must be filled'
            });
        }

        /* upload video to cloudinary and get secure_url */
        const uploadDetails = await uploadImageToCloudinary( videoUrl , process.env.CLOUDINARY_FOLDER_NAME_COURSE_VIDEOS );
        /* create newSubSection */
        const newSubSection = await SubSection.create({
            title ,
            timeDuration ,
            description ,
            videoUrl : uploadDetails.secure_url
        });

        /* add newSubSection ID to Section schema subSection property */
        await Section.findByIdAndUpdate({ _id : sectionId } , {
            $push : {
                subSection : newSubSection._id
            }
        });

        /* get updated course */
        const updatedCourseDetails = await Course.findById(courseId)
        .populate([
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
            data : updatedCourseDetails ,
            message : 'Sub Section created Successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        })
    }
}

const updateSubSection = async ( req , res ) => {
    try{
        /* get data */
        const { title , timeDuration , description , courseId } = req.body ;
        const subSectionId = req.params.subSectionId;

        /* delete video which is already uploaded in cloudinary */
        const subSection = await SubSection.findById( subSectionId );
        const prevVideo = subSection.videoUrl ;
        let video_id = prevVideo.split('/').pop().split('.')[0];
        await deleteFileFromCloudinary( video_id , process.env.CLOUDINARY_FOLDER_NAME_COURSE_VIDEOS , 'video');

        let video = null;
        let videoUrl = null ;
        if( req.files === null ){
            // It means thumbnail has not been updated , the previous thumbnail will come inside body bcoz it's a string not a file
            video = req.body.videoUrl;
        } 
        else{
            /* upload new updated image to cloudinary */
            video = req.files.videoUrl;
            videoUrl = await uploadImageToCloudinary( video , process.env.CLOUDINARY_FOLDER_NAME_COURSE_VIDEOS );
            if( !videoUrl ){
                return res.status(403).json({
                    success : false ,
                    message : 'Error in Upload to cloudinary'
                })
            }
        }

        // console.log('subSectionId' , subSectionId);
        // console.log('video' , videoUrl);
        /* validate data */
        if( !title ||  !subSectionId || !timeDuration || !description ){
            return res.status(403).json({
                success : false ,
                message : 'All required fields must be filled'
            });
        }

        


        /* upload latest video */
        // const uploadDetails = await uploadImageToCloudinary( video , process.env.CLOUDINARY_FOLDER_NAME_COURSE_VIDEOS );
        // if( !uploadDetails ){
        //     return res.status(403).json({
        //         success : false ,
        //         message : 'Error in uploading video to cloudinary'
        //     })
        // }

        /* update subSection */
        await SubSection.findByIdAndUpdate({ _id : subSectionId } , {
            title : title ,
            timeDuration ,
            description ,
            videoUrl : videoUrl ? videoUrl.secure_url : video
        });

        /* get updated course */
        const updatedCourseDetails = await Course.findById(courseId)
        .populate([
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
            data : updatedCourseDetails ,
            message : 'SubSection updated successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error
        });
    }
}

const deleteSubSection = async ( req , res ) => {
    try{
        /* get ID - assuming that we are getting ID through params */
        // const courseId = req.body.courseId;
        
        const subSectionId = req.params.subSectionId ;
        const sectionId = req.params.sectionId ;
        const courseId = req.params.courseId ;
        /* delete subSection from Section Schema also  */
        await Section.findByIdAndUpdate( { _id : sectionId } , {
            $pull : {
                'subSection' : subSectionId
            }
        });

        /* delete Video from cloudinary */
        const subSection = await SubSection.findById( subSectionId );
        const videoUrl = subSection.videoUrl ;
        let video_id = videoUrl.split('/').pop().split('.')[0];
        await deleteFileFromCloudinary( video_id , process.env.CLOUDINARY_FOLDER_NAME_COURSE_VIDEOS , 'video');

        /* delete Section from DB */
        await SubSection.findByIdAndDelete({ _id : subSectionId });

        /* get updated course */
        const updatedCourseDetails = await Course.findById(courseId)
        .populate([
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

        if( !updatedCourseDetails ){
            res.status(403).json({
                success : false ,
                message : 'Error in fetching updated course details'
            })
        }
        /* return response */
        return res.status(200).json({
            success : true ,
            data  : updatedCourseDetails ,
            message : 'SubSection deleted successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

module.exports = { createSubSection , updateSubSection , deleteSubSection };