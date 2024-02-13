const razorpayInstance  = require('../config/razorpay');
const User = require('../models/User');
const Course = require('../models/Course');
const mailSender = require('../utils/mailSender');
const mongoose = require('mongoose');
const crypto = require('crypto')
const dotenv = require('dotenv');
const CourseProgress = require('../models/CourseProgress');
dotenv.config();
// import mail template - courseEnrollmentEmail

const capturePayment = async ( req , res ) => {
    const courses = req.body.courses;
    const userId = req.user.id ;
    // const totalAmount = req.body.totalAmount;
    /* validation */
    if( courses.length === 0 || !userId ){
        return res.status(403).json({
            success : false ,
            message : 'Invalid details in body'
        });
    }

    let totalAmount=0;
    for( const courseId of courses ){
        let course ;
        try{
            course = await Course.findById(courseId);
            if(!course){
                return res.status(403).json({
                    success : false ,
                    message : 'Course not found' 
                })
            }

            /* check if user already paid for the same course */
            const uId = new mongoose.Types.ObjectId(userId);
            console.log(userId , uId)
            if(course.studentsEnrolled.flatMap((c) => c._id).includes(userId)){
                return res.status(400).json({
                    success : false ,
                    message : 'Student is already enrolled'
                })
            }
        }catch(error){
            return res.status(403).json({
                success : false ,
                message : error.message 
            })
        }
        totalAmount += parseInt(course.price);
    }
    /* create razorpay order */
    const options = {
        amount: totalAmount * 100,  
        currency: "INR" ,
        receipt: Date.now().toString() ,
    }
    // console.log(totalAmount);
    console.log('3')
    try{
        const paymentResponse = await razorpayInstance.orders.create(options);
        console.log('Capture payment order created..........' , paymentResponse);
        console.log('4')
        return res.status(200).json({
            success : true ,
            data : paymentResponse ,
            message : 'Order initiated successfully'
        })
        
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : 'Could not initiate order'
        })
    }
}

// capture the payment and initiate the order

// const capturePayment = async ( req , res ) => {
//     /* get courseId and userId */
//     const courseId = req.params.courseId ;
//     const userId = req.user.id ;

//     /* validation */
//     if( !courseId || !userId ){
//         return res.status(403).json({
//             success : false ,
//             message : 'Invalid details'
//         });
//     }

//     let course ;
//     try{
//         course = await Course.findById(courseId);
//         if(!course){
//             return res.status(403).json({
//                 success : false ,
//                 message : 'Course not found' 
//             })
//         }

//         /* check if user already paid for the same course */
//         const uId = mongoose.Types.ObjectId(userId);
//         if(course.studentsEnrolled.includes(uId)){
//             return res.status(400).json({
//                 success : false ,
//                 message : 'Student is already enrolled'
//             })
//         }
//     }catch(error){
//         return res.status(403).json({
//             success : false ,
//             message : error.message 
//         })
//     }
    
//     /* create razorpay order */
//     const options = {
//         amount: 500 * 100 ,  
//         currency: "INR" ,
//         receipt: Date.now().toString() ,
//         notes : {
//             courseId ,
//             userId
//         }
//     };
//     try{
//         const paymentResponse = await razorpayInstance.orders.create(options);
//         console.log('Capture payment order created..........' , paymentResponse);
//         return res.status(200).json({
//             success : true ,
//             data : {
//                 courseName : course.courseName ,
//                 courseDescription : course.courseDescription ,
//                 thumbnail : course.thumbnail ,
//                 orderId : paymentResponse.id ,
//                 currency : paymentResponse.currency ,
//                 amount : paymentResponse.amount ,
//             } ,
//             message : 'Order initiated successfully'
//         })
//     }catch(error){
//         return res.status(403).json({
//             success : false ,
//             message : 'Could not initiate order'
//         })
//     }
// }



// verify signature send by Razorpay and that which is present in server

const verifyPayment = async ( req , res ) => {
    const { razorpay_order_id , razorpay_payment_id , razorpay_signature , courses  } = req.body;
    const userId = req.user.id ;

    console.log('verify payment courses ye h......' , courses)
    console.log(courses);
    if( !razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId ){
        return res.status(403).json({
            success : false ,
            message : 'Payment Failed'
        });
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
    .createHmac('sha256' , process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest('hex')

    if( expectedSignature === razorpay_signature ){
        /* payment is authorised now perform whatever actions you need to do after successful payment*/
        try{
            for( const courseId of courses ){
                // Action 1 : Push user's id in each course schema 
                console.log('1');
                const enrolledCourse = await Course.findOneAndUpdate({ _id : courseId } , {
                    $push : {
                        studentsEnrolled : userId
                    }
                } , { new : true });
    
                if(!enrolledCourse){
                    return res.status(403).json({
                        success : false ,
                        message : 'Course Enrollment not successfull'
                    })
                }
                
                // creating course progress of this course
                const courseProgress = await CourseProgress.create({
                    courseId : courseId,
                    userId : userId ,
                    progressPercentage : 0 ,
                    completedVideos : [] ,
                });

                // pushing courseProgressId in user's schema
                const updatedUser = await User.findOneAndUpdate( {_id : userId} , {
                    $push : {
                        courseProgress : courseProgress._id
                    }
                } , { new : true });
                // console.log( 'courseProgress creating after payment ...' , courseProgress);
                if( !courseProgress ){
                    return res.status(403).json({
                        success : false ,
                        message : 'Error in creating courseProgress'
                    })
                }
                // Action 2 : Push each courseId in the user's schema
                const enrolledStudent = await User.findOneAndUpdate( { _id : userId } , {
                    $push : {
                        courses : courseId ,
                        courseProgress : courseProgress._id
                    }
                } , { new : true });
    
                if(!enrolledStudent){
                    return res.status(403).json({
                        success : false ,
                        message : 'Course not able to list in students courses list'
                    })
                }

                // Send confirmation mail to user
                const mailResponse = await mailSender( 
                    enrolledStudent.email , 
                    `Congratulations` , 
                    ` Enrolled in course successfully ` 
                );
                
                console.log('Successfully sent mail............... ' , mailResponse)
            }
            return res.status(200).json({
                success : true ,
                message : 'Enrolled in course successfully'
            })
        }catch(error){
            return res.status(500).json({
                success  : false ,
                message : error
            })
        }
    }
}

const sendPaymentSuccessEmail = async ( req , res ) => {
    try{
        const { orderId , paymentId , amount } = req.body;
        const userId = req.user.id ;

        if( !orderId || !paymentId || !amount || !userId){
            return res.status(403).json({
                success : false ,
                message : "Invalid data from body"
            });
        }

        const enrolledStudent = await User.findById( userId );
        const mailResponse = await mailSender( 
            enrolledStudent.email ,
            'Payment Recieved . Thank You for buying course ' ,
            `${ enrolledStudent.firstName } , ${ amount/100 } , ${ orderId } , ${ paymentId }`
        ) 

        return res.status(200).json({
            success : true ,
            message : "Email Successfully sent"
        })
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error
        });
    }
}
// const verifySignature = async ( req , res ) => {
//     const webhookSecret = '12345678'
//     const signature = req.headers['x-razorpay-signature'];

//     /* encrypting webhookSecret to the same format of razorpay signature 
//     using Hmac (a wrapper function for hashing algo and secret key) */

//     const shasum = crypto.createHmac('sha256' , webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest('hex');

//     if(signature === digest){
//         /* payment is authorised now perform whatever actions you need to do after successful payment*/

//         const  { courseId , userId } = req.body.payload.payment.entity.notes ;
//         try{
//             /* Actions */
//             /* 1. find the course and enroll the student in it */
//             const enrolledCourse = await Course.findByIdAndUpdate({ _id : courseId } , {
//                 $push : {
//                     studentsEnrolled : userId
//                 }
//             } , { new : true });

//             if(!enrolledCourse){
//                 return res.status(403).json({
//                     success : false ,
//                     message : 'Course Enrollment not successfull'
//                 })
//             }
//             /* 2. find the student and push the course in it's User Schema courses array */
//             const enrolledStudent = await User.findByIdAndUpdate( { _id : userId } , {
//                 $push : {
//                     courses : courseId
//                 }
//             });

//             if(!enrolledStudent){
//                 return res.status(403).json({
//                     success : false ,
//                     message : 'Course not able to list in students courses list'
//                 })
//             }

//             /* 3. send confirmation mail */
//             const mailResponse = await mailSender( email , `Congratulations` , ` Enrolled in course successfully ` );

//             return res.status(200).json({
//                 success : true ,
//                 message : 'Enrolled in course successfully'
//             })
//         }catch(error){
//             return res.status(403).json({
//                 success : false ,
//                 message : error.message
//             })
//         }

//     }
// }

module.exports = { capturePayment , verifyPayment , sendPaymentSuccessEmail };