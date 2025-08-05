import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localfilePath) =>{
    try {
        if(!localfilePath) return null;
        // upload file on cloudinary
        const response =await cloudinary.uploader.upload(localfilePath,{
            resource_type:"auto"
        });
        // file has been uploaded successfully

        // console.log("File is uploaded on Cloudinary",response.url)

        fs.unlinkSync(localfilePath)

        return response;
        

    } catch (error) {
        fs.unlinkSync(localfilePath); // remove the locally saved file as the upload operation got fails

        return null;
    }
}

// delete previous uploaded file from the cloud server
// const deleteFileFromTheCloudinary=async ()

export {uploadOnCloudinary}