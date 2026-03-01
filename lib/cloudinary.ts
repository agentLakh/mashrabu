import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Upload un buffer audio vers Cloudinary
export async function uploadAudio(
  buffer: Buffer,
  filename: string,
  folder: string = 'mashrabu'
): Promise<{ url: string; public_id: string; duration: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video', // Cloudinary classe les audios dans "video"
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ''), // retire l'extension
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          duration: Math.round(result.duration || 0),
        });
      }
    );
    uploadStream.end(buffer);
  });
}
