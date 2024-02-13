const express = require('express');
const app = express();

const cors = require('cors');
const cookieParser = require('cookie-parser');

/*---------- inserting env variables in process object ----------*/
const dotenv = require('dotenv');
dotenv.config();

/*---------- middleware file upload to server ----------*/
// This middleware is required in both cases either u upload on server or to cloudinary
const fileUpload = require('express-fileupload');
app.use( fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}) );

/*---------- extra middleware ----------*/
app.use( cookieParser() );
app.use( express.json() );
/*----- cors enables back-end to entertain front-end requests -----*/
app.use( cors({
    origin : 'http://localhost:3000' ,
    credentials : true 
}) );

/*---------- Mounting Routes ----------*/
const courseRoutes = require('./routes/Course');
const paymentRoutes = require('./routes/Payment');
const profileRoutes = require('./routes/Profile');
const userRoutes = require('./routes/User');
app.use('/api/v1/course' , courseRoutes);
app.use('/api/v1/payment' , paymentRoutes);
app.use('/api/v1/profile' , profileRoutes);
app.use('/api/v1/auth' , userRoutes);

/*---------- DB connection ----------*/
const dbConnect = require('./config/database')
dbConnect();

/*---------- Cloudinary connection ----------*/
const cloudinaryConnect = require('./config/cloudinary');
cloudinaryConnect();


/*--- default route ---*/
app.get('/' , ( req , res ) => {
    return res.json({
        success : true ,
        message : 'Your server is up and running...'
    });
})

app.listen( process.env.PORT , () => {
    console.log('Server Running on Port' , process.env.PORT);
});