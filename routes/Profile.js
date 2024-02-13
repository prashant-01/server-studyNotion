const express = require('express');
const router = express.Router();

const { auth, isInstructor } = require('../middlewares/auth');

const { updateProfile , updateProfilePicture , deleteProfilePicture , deleteAccount , getUserDetails , getUserEnrolledCourses, instructorDashboard } = require('../controllers/Profile');

router.get('/get-user-details' , auth , getUserDetails);
router.patch('/get-user-enrolled-courses' , auth , getUserEnrolledCourses);
router.get('/instructor-dashboard-data' , auth , isInstructor , instructorDashboard );
router.patch('/update-profile' , auth , updateProfile);
router.patch('/update-display-profile' , auth , updateProfilePicture);
router.patch('/delete-display-profile' , auth , deleteProfilePicture);
router.delete('/delete-account' , auth , deleteAccount);

module.exports = router;