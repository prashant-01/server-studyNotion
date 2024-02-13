const Category = require('../models/Category');

const createCategory = async ( req , res ) => {
    console.log(req.body);
    try{
        
        /* get data from req.body */
        const { name , description } = req.body ;
        console.log( name , description )
        
        /* validate data */
        if( !name ){
            return res.status(403).json({
                success : false ,
                message : 'All required fields must be filled'
            });
        }

        /* create entry in DB */
        await Category.create( {name : name , description : description} );

        /* return response */
        return res.status(200).json({
            success : true ,
            message : 'Category created successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : "heyy"
        })
    }
}

const getAllCategories = async ( req , res ) => {
    try{
        const allCategories = await Category.find({});
        return res.status(200).json({
            success : true ,
            data : allCategories ,
            message : 'All Category recieved successfully'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        })
    }
}

const categoryPageDetails = async ( req , res ) => {
    try{
        const categoryId = req.params.categoryId ;

        /* get courses for this categoryID */
        const selectedCategory = await Category.findById(categoryId)
        .populate([{
            path : 'courses' ,
            model : 'Course' ,
            match : { status : 'Published' } ,
            populate : {
                path : 'ratingAndReviews' ,
                model : 'RatingAndReview'
            } ,
            populate : {
                path : 'instructor' ,
                model : 'User'
            } ,
        }]).exec();

        /* validate category found */
        if( !selectedCategory ){
            return res.status(403).json({
                success : false ,
                message : 'Category not found'
            });
        }

        // const mostPopularCoursesOfThisCategory = selectedCategory.courses
        // .sort( (courseA , courseB) => courseA.studentsEnrolled.length > courseB.studentsEnrolled.length )
        // .slice(0 , 5);

        // const newCoursesOfThisCategory = selectedCategory.courses
        // .sort({ createdAt : -1 })
        // .slice(0 , 5);

        /* if no courses found for this category */
        // if( selectedCategory.courses.length === 0 ){
        //     return res.status(403).json({
        //         success : false ,
        //         message : 'No courses found for selected category'
        //     });
        // }

        /* Get courses for other categories */
        const categoriesExceptSelected = await Category.find({ _id : { $ne : categoryId } })
        .populate([{
            path : 'courses' ,
            model : 'Course' ,
            match : { status : 'Published' } ,
            populate : {
                path : 'ratingAndReviews' ,
                model : 'RatingAndReview'
            } ,
            populate : {
                path : 'instructor' ,
                model : 'User'
            } ,
        }]).exec();
        //const differentCourses = categoriesExceptSelected.flatMap( (category) => category.courses );
        const differentCourses = [];
        for(const category of categoriesExceptSelected ){
            differentCourses.push( ...category.courses );
        }

        /* Get top-selling courses accross all categories */
        const allCategories = await Category.find({})
        .populate([{
            path : 'courses' ,
            model : 'Course' ,
            match : { status : 'Published' } ,
            populate : {
                path : 'ratingAndReviews' ,
                model : 'RatingAndReview'
            } ,
            populate : {
                path : 'instructor' ,
                model : 'User'
            } ,
        }]).exec();

        const allCourses = allCategories.flatMap( (category) => category.courses );
        const topSellingCourses = allCourses
        //.sort( (a , b) => b.sold - a.sold )
        .sort( ( courseA , courseB ) => courseA.studentsEnrolled.length > courseB.studentsEnrolled.length )
        .slice(0 , 10);

        /* return response */
        return res.status(200).json({
            success : true ,
            data : {
                selectedCategory ,
                differentCourses ,
                topSellingCourses
            } ,
            message : 'fetched category details'
        });
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        })
    }
}

module.exports = { createCategory , getAllCategories , categoryPageDetails }; 