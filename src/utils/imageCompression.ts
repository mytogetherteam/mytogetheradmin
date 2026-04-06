/**
 * Compresses an image using Canvas if its size exceeds the maximum size (default 600KB).
 * @param file The original image File object.
 * @param maxSizeKB The maximum allowed size in kilobytes (default 600).
 * @param maxWidth The maximum width for the canvas (default 1920).
 * @param maxHeight The maximum height for the canvas (default 1080).
 * @param quality The compression quality (0 to 1, default 0.8).
 * @returns A Promise that resolves to the compressed File, or the original File if it's already small enough.
 */
export const compressImage = async (
  file: File,
  maxSizeKB: number = 600,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> => {
  // Check if file is already smaller than the max size
  if (file.size / 1024 <= maxSizeKB) {
    return file;
  }

  // Only compress images
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // If canvas context fails, return original file
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type || "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Compression failed, return original
            }
          },
          file.type === "image/png" ? "image/png" : "image/jpeg", // Convert webp/others to jpeg, keep png
          quality
        );
      };
      img.onerror = () => {
        resolve(file); // If image loading fails, return original
      };
    };
    reader.onerror = () => {
      resolve(file); // If file reading fails, return original
    };
  });
};
