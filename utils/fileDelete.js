const cloudinary = require('cloudinary').v2;

const deleteFileFromCloudinary = async ( id , folder_name , type) => {
    try{
        return await cloudinary.uploader.destroy(`${folder_name}/${id}` , { resource_type : `${ type }` });
    }catch(error){
        console.log(error , 'hi delete');
    }
}

module.exports = deleteFileFromCloudinary ;