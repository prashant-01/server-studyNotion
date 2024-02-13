const express = require('express');
const router = express.Router();

const { auth , isStudent , isInstructor , isAdmin } = require('../middlewares/auth');

const { createCourse , editCourse , deleteCourse , getPublishedCourses , getCourseDetails , getFullCourseDetails , getInstructorCourses, updateCourseStats, getCourseDetailsWithDuration, updateCourseStatus } = require('../controllers/Course');
const { createSection , updateSection , deleteSection } = require('../controllers/Section');
const { createSubSection , updateSubSection , deleteSubSection } = require('../controllers/SubSection');
const { createCategory , getAllCategories , categoryPageDetails } = require('../controllers/Category');
const { createRatingAndReview , getAverageRating , getAllRatingAndReview , isReviewMade } = require('../controllers/RatingAndReview');
const { updateCourseProgress, completeUpdateProgress } = require('../controllers/CourseProgress')

router.post('/create-course' , auth , isInstructor , createCourse);
router.patch('/edit-course' , auth , isInstructor , editCourse);
router.patch('/update-course-status' , auth , isInstructor , updateCourseStatus);
router.get( '/get-published-courses' , getPublishedCourses );
router.get('/get-course-details/:courseId' , getCourseDetails);
router.patch('/get-course-details-duration/:courseId' , getCourseDetailsWithDuration);
router.get('/get-full-course-details/:courseId' , auth , getFullCourseDetails);
router.get('/get-instructor-courses' , auth , isInstructor , getInstructorCourses);
router.delete('/delete-course' , auth , isInstructor , deleteCourse);

router.post('/create-section/:courseId' , auth , isInstructor , createSection);
router.patch('/update-section/:sectionId' , auth , isInstructor , updateSection);
router.delete('/delete-section/:sectionId/:courseId' , auth , isInstructor , deleteSection);

router.post('/create-sub-section/:sectionId' , auth , isInstructor , createSubSection);
router.patch('/update-sub-section/:subSectionId' , auth , isInstructor , updateSubSection);
router.delete('/delete-sub-section/:subSectionId/:sectionId/:courseId' , auth , isInstructor , deleteSubSection);

router.post('/create-category'  , auth , isAdmin , createCategory);
router.get('/category-page-details/:categoryId' , categoryPageDetails);
router.get( '/get-all-categories' , getAllCategories );

router.post('/create-rating-and-review/:courseId' , auth , isStudent , createRatingAndReview);
router.get( '/get-average-rating/:courseId' , getAverageRating );
router.get('/get-all-rating-and-reviews' , getAllRatingAndReview);
router.get('/is-review-made/:courseId' , auth , isStudent , isReviewMade );

router.patch('/update-course-progress' , auth , isStudent , updateCourseProgress );
router.patch('/mark-course-complete' , auth , isStudent , completeUpdateProgress);
module.exports = router ;