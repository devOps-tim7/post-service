var cloudinary = require('cloudinary').v2;

const uploadToCloudinary = (pathToImage: string): Promise<string> =>
  new Promise<string>((resolve) => {
    cloudinary.uploader.upload(pathToImage, function (error, result) {
      if (error) {
        throw new Error(error);
      }
      resolve(result.secure_url);
    });
  });

export default {
  uploadToCloudinary,
};
