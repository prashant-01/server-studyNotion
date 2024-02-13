const express = require('express');
const router = express.Router();

const { auth } = require('../middlewares/auth');

const { sendOTP , signUp , login , changePassword, logout } = require('../controllers/Auth');
const { resetPasswordToken , resetPassword } = require('../controllers/ResetPassword');
const { createContact } = require('../controllers/ContactUs');


router.post('/send-otp' , sendOTP);
router.post('/signup' , signUp);
router.post('/login' , login);
router.post('/logout' , logout);
router.post('/change-password' , auth , changePassword);

router.post('/reset-password-token' , resetPasswordToken);
router.post('/reset-password' , resetPassword);

router.post('/contact-us' , createContact);
module.exports = router;