const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
// reset password token
const resetPasswordToken = async ( req , res ) => {
    try{
        /* get email from req body */
        const { email } = req.body;

        /* check user for this email , email validation */
        const user = await User.findOne({ email : email });
        if(!user){
            return res.status(403).json({
                success : false ,
                message : 'User with this email not found'
            });
        }
        /* generate Token */
        const token = crypto.randomBytes(20).toString('hex');

        /* update token and expiration time in User model */
        const filter = { email : email };
        const update = {
            token : token ,
            resetPasswordExpires : Date.now() + 3600000 ,  
        }
        await User.findOneAndUpdate( filter , update , { new : true });

        /* create reset Password URL */
        const url = `http://localhost:3000/update-password/${ token }`

        /* send mail containing URL */
        await mailSender( email , 'Password Reset Link' , `Click the link to reset password : ${ url }`);

        /* return response */
        return res.status(200).json({
            success : true ,
            message : 'Email sent successfully , reset password'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

// reset password
const resetPassword = async ( req , res ) => {
    try{
        /* fetch data from req.body */
        const { newPassword , confirmNewPassword , token } = req.body ;

        /* validate data */
        console.log(newPassword , confirmNewPassword)
        if( newPassword !== confirmNewPassword ){
            return res.status(403).json({
                success : false ,
                message : 'Password & Confirm Password does not match'
            });
        }

        /* get User details from DB using User Token which is used in creating reset Password URL */
        const userDetails = await User.findOne({ token : token });

        /* validate token - either no entry found corresponding to that token or token time expires  */
        if(!userDetails){
            return res.status(403).json({
                success : false ,
                message : 'Invalid Token'
            });
        }
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.status(403).json({
                success : false ,
                message : 'Token expired , please generate new Token'
            });
        }
        
        /* Hash password */
        const hashedPassword = await bcrypt.hash(newPassword , 10 );

        /* update password */
        const filter = { token };
        const update = { password : hashedPassword };
        const response = await User.findOneAndUpdate( filter , update , { new : true });

        /* return response */
        return res.status(200).json({
            success : true ,
            data : response ,
            message : 'Password Reset Successful'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        });
    }
}

module.exports = { resetPasswordToken , resetPassword };