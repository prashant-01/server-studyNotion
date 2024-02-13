const express = require('express');
const router = express.Router();

const { auth , isStudent } = require('../middlewares/auth');

const { capturePayment , verifyPayment , sendPaymentSuccessEmail} = require('../controllers/Payments');

router.post('/capture-payment' , auth , isStudent , capturePayment);
router.post('/verify-payment' , auth , isStudent , verifyPayment);
router.post( '/send-payment-success-email' , auth , sendPaymentSuccessEmail );


module.exports = router ;