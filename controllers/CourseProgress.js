const SubSection = require("../models/SubSection");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");

const updateCourseProgress = async ( req , res ) => {
    const { courseId , subSectionId , totalNoOfLectures } = req.body;
    const userId = req.user.id;
    try{
        // check if the subSection is valid
        const subSection = await SubSection.findOne({ _id : subSectionId });
        if( !subSection )return res.status(403).json({
            success : false ,
            message : "Invalid Credentials"
        })

        // check if courseProgress old entry is present or not ( which is created after successful payment )
        let courseProgress = await CourseProgress.findOne({
            courseId : courseId ,
            userId : userId
        })
        if( !courseProgress ){
            return res.status(403).json({
                success : false ,
                message : 'Course Progress not found'
            })
        }

        //  if found then update 
        const multiplier = Math.pow(10 , 2);
        let progress = Math.round(((courseProgress.completedVideos.length + 1)/totalNoOfLectures)*100*multiplier)/multiplier;
        
        const updatedCourseProgress = await CourseProgress.findOneAndUpdate( {
            courseId : courseId ,
            userId : userId
        } , {
            progressPercentage : progress ,
            completedVideos : [ ...courseProgress.completedVideos , subSectionId ]
        } , { new : true });

        return res.status(200).json({
            success : true ,
            data : updatedCourseProgress ,
            message : 'Successfully updated course progress'
        })
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error
        })
    }
}

const completeUpdateProgress = async ( req , res ) => {
    try{
        const { courseId } = req.body;
        
        const course = await Course.findOne({ _id : courseId })
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

        if( !course )return res.status(403).json({
            success : false ,
            message : "Invalid Credentials"
        })

        let allSubSections=[];
        for( section of course.courseContent ){
            let res = section.subSection.flatMap( (s) => s._id );
            allSubSections = [ ...allSubSections , ...res ];
        }
        
        const courseProgress = await CourseProgress.findOneAndUpdate( { 
            courseId : courseId ,
            userId : req.user.id
        } , {
            progressPercentage : 100 ,
            completedVideos : allSubSections
        } , { new : true });
        
        return res.status(200).json({
            success : true ,
            data : allSubSections ,
            message : 'Successfully done course progress'
        })
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error
        })
    }
}
module.exports = { updateCourseProgress , completeUpdateProgress }

