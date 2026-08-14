import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

export const uploadImage = (
  buffer: Buffer,
  folder: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }

        console.log("Cloudinary upload successful:", result.secure_url);

        resolve(result);
      },
    );

    uploadStream.on("error", (error) => {
      console.error("Cloudinary stream error:", error);
      reject(error);
    });

    uploadStream.end(buffer);
  });
};
