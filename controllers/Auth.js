const User = require('../models/User');
const OTP = require('../models/OTP');
const Profile = require('../models/Profile');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require('../utils/mailSender');
const dotenv = require('dotenv');
dotenv.config();

// OTP verification
function generateOTP(){
    let otp = otpGenerator.generate( 6 , {
        upperCaseAlphabets : false ,
        lowerCaseAlphabets : false ,
        specialChars : false ,
    } );
    return otp;
}
const sendOTP = async ( req , res ) => {
    try{
        /* fetching email from req.body */
        const { email } = req.body ;

        /* checking if user exist or not */
        const checkUserExist = await User.findOne({ email });
        if(checkUserExist){
            return res.status(401).json({
                success : false ,
                message : 'User already exist'
            });
        }

        /* Unique OTP generation */
        let otp = generateOTP();
        const result = await OTP.findOne({ otp : otp });
        while(result){
            otp = generateOTP();
            result = await OTP.findOne({ otp : otp });
        }

        /* creating entry in DB */
        const otpPayload = { email , otp };
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        /* sending response */
        res.status(200).json({
            success : true ,
            message : 'Successfully sent OTP'
        });
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error
        });
    }
}
// SignUp
const signUp = async ( req , res ) => {
    try{
        /* data fetch from req.body */
        const {
            firstName ,
            lastName ,
            email ,
            createPassword ,
            confirmPassword ,
            accountType ,
            otp
        } = req.body ;

        /* validation of data */
        if( !firstName || !lastName || !email || !createPassword || !confirmPassword || !otp ){
            return res.status(403).json({
                success : false ,
                message : 'All required fields must be filled'
            });
        }

        /* match password & confirm password */
        if(createPassword !== confirmPassword){
            return res.status(400).json({
                success : false ,
                message : 'Password and Confirm Password does not match'
            });
        }

        /* check if user already exist or not */
        const checkUserExist = await User.findOne({ email });
        if(checkUserExist){
            return res.status(403).json({
                success : false ,
                message : 'User already exist'
            });
        }

        /* find most recent OTP stored for the user */
        const recentOTP = await OTP.findOne({ email }).sort({ createdAt : -1 }).limit(1);

        /* validate the otp */
        if(!recentOTP){
            /* OTP not found */
            return res.status(400).json({
                success : false ,
                message : 'OTP not found'
            });
        }
        if(recentOTP.otp !== otp){
            /* Invalid OTP */
            return res.status(400).json({
                success : false ,
                message : 'Invalid OTP'
            });
        }

        /* Hash password */
        const hashedPassword = await bcrypt.hash( createPassword , 10 );

        /* create a null profile & entry in DB */
        const profile = await Profile.create({
            gender : null ,
            dateOfBirth : null ,
            about : null ,
            contactNumber : null ,
        });
        const space = ' ';
        const user = await User.create({
            firstName ,
            lastName ,
            email ,
            password : hashedPassword ,
            image : `https://api.dicebear.com/5.x/initials/svg?seed=${firstName }${ space }${lastName}`,
            accountType ,
            additionalDetails : profile._id ,
            courses : [] ,
            courseProgress : [] ,
        });

        /* return res */
        res.status(200).json({
            success : true ,
            data : user ,
            message : 'User registered Successfully'
        });

    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error.message
        });
    }
}
// Login
const login = async ( req , res ) => {
    try{
        /* fetch data from req.body */
        const { email , password } = req.body ;

        
        /* validate data */
        if( !email || !password ){
            return res.status(403).json({
                success : false ,
                message : 'All required fields must be filled'
            });
        }

        /* check if user already exist or not */
        let user = await User.findOne({ email }).populate('additionalDetails');
        if(!user){
            return res.status(403).json({
                success : false ,
                message : 'User not found'
            });
        }

        /* if password matched then generate JWT token */
        if(await bcrypt.compare(password , user.password)){
            const payload = {
                id : user._id ,
                email : user.email ,
                role : user.accountType 
            }
            let token = jwt.sign( payload , process.env.JWT_SECRET , {
                expiresIn : '24h'
            });
            user = user.toObject();
            user.token = token;
            //user.password = undefined ;
        /* create cookie and send response */
            const options = {
                expires : new Date( Date.now() + 3*24*60*60*1000 )
            }
            res.cookie('token' , token , options).status(200).json({
                success : true ,
                data : user ,
                message : 'Login Successful'
            });
        }
        else{
            return res.status(403).json({
                success : false ,
                message : 'Password does not match'
            });
        }
    }catch(error){
        return res.status(500).json({
            success : false, 
            message : error.message 
        })
    }
}

// Logout
const logout = async ( req , res ) => {
    try{
        req.user = null ;
        return res.status(200).json({
            success : true ,
            message : 'Logged out Successfully'
        })
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error.message 
        })
    }
}

// Change Password 
const changePassword = async ( req , res ) => {
    try{
        /* fetch data from req.body */
        const { oldPassword , newPassword , confirmPassword } = req.body ;
        const { email } = req.user ;
        /* validate data */
        if( !email || !oldPassword || !newPassword || !confirmPassword ){
            return res.status(403).json({
                success : false ,
                message : 'All required fields must be filled'
            });
        }

        if( newPassword !== confirmPassword ){
            return res.status(403).json({
                success : false ,
                message : 'Password and confirm Password does not match'
            });
        }

        /* update password in DB */
        const user = await User.findOne({ email : email });
        
        if(!user){
            return res.status(403).json({
                success : false ,
                message : 'user not found'
            })
        }
        if( await bcrypt.compare( oldPassword , user.password ) ){
            const newPasswordHashed = await bcrypt.hash(newPassword , 10);
            const filter = { email : email };
            const update = { password : newPasswordHashed };
            await User.findOneAndUpdate( filter , update );
        }
        else{
            return res.status(403).json({
                success : false ,
                message : 'Old password incorrect'
            })
        }
        /* send update mail */
        await mailSender( email , 
            'Password updated Successfully' , 
            `<h2>At ${ Date.now() } password has been updated successfully</h2>` );

        /* send response */
        return res.status(200).json({
            success : true ,
            message : 'Password has been Updated successfully'
        });
    }catch(error){
        return res.status(500).json({
            success : false, 
            message : error.message 
        })
    }
}
module.exports = { sendOTP , signUp , login , logout , changePassword };