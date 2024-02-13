const Section = require('../models/Section');
const Course = require('../models/Course');
const deleteFileFromCloudinary = require('../utils/fileDelete');
const SubSection = require('../models/SubSection');

const createSection = async ( req , res ) => {
    try{
        /* get data */
        const { sectionName } = req.body ;
        const courseId = req.params.courseId ;
        
        /* validate */
        if( !sectionName || !courseId ){
            return res.status(403).json({
                success : false ,
                message : 'All required fields must be filled'
            });
        }

        /* create Section */
        const newSection = await Section.create({ sectionName : sectionName });

        /* push created SectionID to Course schema courseContent array */
        const updatedCourseDetails = await Course.findByIdAndUpdate({ _id : courseId } , {
            $push : {
                'courseContent' : newSection._id 
            }
        } , 
        { new : true })
        .populate([
            {
                path : 'courseContent' ,
                model : 'Section' ,
                populate : {
                    path : 'subSection' ,
                    model : 'SubSection' 
                }
            } , 
            // {
            //     path : '' ,
            //     model : '' ,
            // }
            // This is the way of writing multiple populate in the same schema 
        ])
        .exec();

        /* return response */
        return res.status(200).json({
            success : true ,
            data : updatedCourseDetails ,
            message : 'Section created successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

const updateSection = async ( req , res ) => {
    try{
        /* get data */
        const { sectionName , courseId } = req.body ;
        const sectionId = req.params.sectionId ;

        /* validate data */
        if( !sectionName ||  !sectionId ){
            return res.status(403).json({
                success : false ,
                message : 'All required fields must be filled'
            });
        }

        /* update section */
        await Section.findByIdAndUpdate({ _id : sectionId } , {
            sectionName : sectionName
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
            message : 'Section updated successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

const deleteSection = async ( req , res ) => {
    try{
        /* get ID - assuming that we are getting ID through params */
        const { sectionId , courseId } = req.params ;

        /* delete Section from Course Schema also  */
        await Course.findByIdAndUpdate( { _id : courseId } , {
            $pull : {
                'courseContent' : sectionId
            }
        });

        /* TODO : delete all videos of sub sections present inside this section from Cloudinary also */

        const section = await Section.findById( sectionId );
        const subSectionsToBeDeleted = section.subSection;
        if(subSectionsToBeDeleted.length !== 0){
            for( const subSection of subSectionsToBeDeleted ){
                const subSectionDetails = await SubSection.findById( subSection );
                const videoUrl = subSectionDetails.videoUrl ;
                let video_id = videoUrl.split('/').pop().split('.')[0];
                await deleteFileFromCloudinary( video_id , process.env.CLOUDINARY_FOLDER_NAME_COURSE_VIDEOS , 'video');
                await SubSection.findByIdAndDelete( { _id : subSection } );
            }
        }

        /* delete Section from DB */
        await Section.findByIdAndDelete({ _id : sectionId });

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
            data  : updatedCourseDetails ,
            message : 'Section deleted successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

module.exports = { createSection , updateSection , deleteSection };