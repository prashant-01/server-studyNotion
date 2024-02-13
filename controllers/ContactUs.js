const Contact = require('../models/ContactUs');

const createContact = async ( req , res ) => {
    try{
        const { email , message } = req.body;

        if( !email || !message ){
            return res.status(403).json({
                success : false ,
                message : 'Fill all required fields'
            });
        } 

        const response = await Contact.create({
            email ,
            message ,
        });

        if( !response ){
            return res.status(403).json({
                success : false ,
                message : 'error in creating contact'
            });
        }

        return res.status(200).json({
            success : true ,
            data : response ,
            message : 'contact created successfully' ,
        });
    }catch(error){
        return res.status(500).json({
            success : false ,
            message : error.message
        });
    }
}

module.exports = { createContact }