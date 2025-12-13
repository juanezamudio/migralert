import { createClient } from "./client";

const BUCKET_NAME = "report-images";

// Generate a unique filename for uploaded images
function generateFileName(file: File): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split(".").pop() || "jpg";
  return `${timestamp}-${randomString}.${extension}`;
}

// Upload an image to Supabase Storage
export async function uploadReportImage(file: File): Promise<string> {
  const supabase = createClient();
  const fileName = generateFileName(file);
  const filePath = `reports/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error uploading image:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get the public URL for the uploaded image
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Upload image from a data URL (useful for camera captures)
export async function uploadReportImageFromDataUrl(
  dataUrl: string
): Promise<string> {
  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Create a File from the Blob
  const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

  return uploadReportImage(file);
}

// Delete an image from storage (for cleanup if report submission fails)
export async function deleteReportImage(imageUrl: string): Promise<void> {
  const supabase = createClient();

  // Extract the file path from the URL
  const url = new URL(imageUrl);
  const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/report-images\/(.+)/);

  if (!pathMatch) {
    console.warn("Could not extract file path from URL:", imageUrl);
    return;
  }

  const filePath = pathMatch[1];

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error("Error deleting image:", error);
    // Don't throw - this is cleanup, not critical
  }
}

// Compress image before upload (for mobile performance)
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}
