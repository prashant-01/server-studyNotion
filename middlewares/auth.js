const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// auth - token verify during login (using jwt.verify)
const auth = async ( req , res , next ) => {
    try{
        /* get token from either req.body (bad practice) or req.cookie or req.header (best practice) */
        let token = req.cookies.token || req.headers.authorization.replace('Bearer ' , '') ;
        /* validate token */
        if(token === null){
            return res.status(403).json({
                success : false ,
                message : 'Token is missing'
            });
        }

        /* verify token using jwt.verify */
        try{
            jwt.verify( token , process.env.JWT_SECRET , function (err, decoded){
                if (err){
                    console.log(err);
                    req.authenticated = false;
                    req.user = null;
                } else {
                    req.user = decoded;
                    req.authenticated = true;
                }
            } );
            
            console.log('payload inserted in request : ' , req.user);
        }catch(error){
            return res.status(403).json({
                success : false ,
                message : error.message
            })
        }

        /* apply next() */
        next();
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message
        })
    }
}

// isStudent - check role of the user
const isStudent = async ( req , res , next ) => {
    try{
        /* get data from the payload which is fetched during auth (jwt.verify) */
        console.log(req.user)
        const role = req.user.role ;

        /* validation */
        if( role !== 'Student'){
            return res.status(403).json({
                success : false ,
                message : 'This route is for Students only'
            });
        }

        /* next() */
        next();
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message 
        })
    }
}

// isInstructor - check role of the user
const isInstructor = async ( req , res , next ) => {
    try{
        /* get data from the payload which is fetched during auth (jwt.verify) */
        const role  = req.user.role ;

        /* validation */
        if( role !== 'Instructor'){
            return res.status(403).json({
                success : false ,
                message : 'This route is for Instructor only'
            });
        }

        /* next() */
        next();
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error.message 
        })
    }
}

// isAdmin - check role of the user
const isAdmin = async ( req , res , next ) => {
    try{
        /* get data from the payload which is fetched during auth (jwt.verify) */
        const role  = req.user.role ;

        /* validation */
        if( role !== "Admin"){
            return res.status(403).json({
                success : false ,
                message : 'This route is for Admin only'
            });
        }

        /* next() */
        next();
    }catch(error){
        return res.status(403).json({
            success : false ,
            message : error
        });
    }
}

module.exports = { auth , isStudent , isInstructor , isAdmin };