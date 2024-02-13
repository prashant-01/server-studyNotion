const cloudinary = require('cloudinary').v2;

const uploadImageToCloudinary = async ( file , folder , quality , height , width ) => {
    const options = { folder };
    if( quality ){
        options.quality = quality;
    }
    if( height || width ){
        options.height = height ;
        options.width = width ;
    }
    options.resource_type = 'auto';
    return await cloudinary.uploader.upload(file.tempFilePath , options);
}

module.exports = uploadImageToCloudinary;