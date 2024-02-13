const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const mailSender = async ( email , title , body ) => {
    try {
        let transporter = nodemailer.createTransport({
            host : process.env.MAIL_HOST ,
            auth : {
                user : process.env.MAIL_USER ,
                pass : process.env.MAIL_PASS
            }
        });

        let info = transporter.sendMail({
            from : `StudyNotion - Prashant` ,
            to : `${ email }` ,
            subject : `${ title }` ,
            html : `${ body }` 
        })

        console.log(info);
        return info ;
    }catch(error){
        console.log('Error occured in transporter mailSender' , error.message);
    }
}

module.exports = mailSender;