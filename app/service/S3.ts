// app/service/s3.ts
import { getToken } from "../../src/utils/auth";

const API_URL = `${import.meta.env.VITE_API_URL}`.replace(/\/$/, "");
const PRESIGN_URL = `${API_URL}/presignurl`;
const IMAGE_VIEW_URL = `${PRESIGN_URL}/view`;

interface UploadResponse {
  imageUrl?: string | null;
  key: string;
}

// ========================
// IMAGE TYPE
// ========================
export type ImageType =
  | "deviceImage"
  | "locationImage"
  | "doctorImage"
  | "staffImage"
  | "hospitalImage"
  | "userImage";

// ========================
// GET FULL IMAGE URL
// ========================
export const getS3ImageUrl = async (
  imageKey?: string | null
): Promise<string | null> => {
  if (!imageKey) return null;

  // Support existing full URLs and temporary local previews.
  if (
    imageKey.startsWith("http://") ||
    imageKey.startsWith("https://") ||
    imageKey.startsWith("data:")
  ) {
    return imageKey;
  }

  try {
    const token = getToken();

    const response = await fetch(
      `${IMAGE_VIEW_URL}?key=${encodeURIComponent(imageKey)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get image URL (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();

    return data.imageUrl || null;
  } catch (error) {
    console.error("Get S3 image URL error:", error);
    return null;
  }
};

// ========================
// IMAGE COMPRESS
// ========================
const compressImage = (
  file: File,
  maxWidth = 1200,
  quality = 0.7
): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            resolve(
              new File([blob], file.name, { type: "image/jpeg" })
            );
          },
          "image/jpeg",
          quality
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
};

// ========================
// GET USER ID FROM AUTH
// ========================
const getUserId = (): string | number | undefined => {
  const auth = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = auth.id || auth.userId || auth.hospitalId;
  return userId;
};

// ========================
// UPLOAD
// ========================
export const uploadToS3 = async (
  file: File,
  key: string | null = null,
  customId?: number | string,
  customRole: string = "hospital",
  imageType?: ImageType
): Promise<UploadResponse> => {
  try {
    const token = getToken();

    // Get ID — use provided customId or fall back to storage
    const id: string | number | undefined = customId || getUserId();

    if (!id) {
      throw new Error(
        "ID is required for S3 upload. Please make sure you are logged in."
      );
    }

    // COMPRESS
    const compressed = await compressImage(file);

    // Build request body
    const body: Record<string, any> = {
      filename: compressed.name,
      contentType: compressed.type,
      role: customRole,
      id,
      ...(key ? { key } : { size: compressed.size }),
    };

    // Only include imageType when provided (device uploads need it)
    if (imageType) {
      body.imageType = imageType;
    }

    const res = await fetch(PRESIGN_URL, {
      method: key ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorText = "";
      try {
        errorText = await res.text();
      } catch {
        errorText = "Could not read error response";
      }

      console.error("Presign API Error Response:", {
        status: res.status,
        statusText: res.statusText,
        body: errorText,
      });

      throw new Error(`Presign failed (${res.status}): ${errorText}`);
    }

    const data = await res.json();

    const upload = await fetch(data.presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": compressed.type,
      },
      body: compressed,
    });

    if (!upload.ok) {
      console.error("Upload to S3 failed:", {
        status: upload.status,
        statusText: upload.statusText,
      });
      throw new Error(`Upload to S3 failed: ${upload.statusText}`);
    }

    return {
      key: data.key,
      imageUrl: data.imageUrl,
    };
  } catch (err) {
    console.error("S3 Upload Error:", err);
    throw err;
  }
};

// ========================
// DELETE
// ========================
export const deleteFromS3 = async (
  key: string,
  id?: string | number,
  role: string = "hospital",
  imageType?: ImageType
) => {
  const token = getToken();
  const finalId: string | number | undefined = id || getUserId();

  if (!finalId) {
    console.warn("No ID found for delete operation");
    return true;
  }

  const body: Record<string, any> = {
    key,
    role,
    id: finalId,
  };

  if (imageType) {
    body.imageType = imageType;
  }

  const res = await fetch(PRESIGN_URL, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorText = "";
    try {
      errorText = await res.text();
    } catch {
      errorText = "Could not read error response";
    }

    console.error("Delete from S3 failed:", {
      status: res.status,
      statusText: res.statusText,
      body: errorText,
    });

    console.warn("Delete failed, but continuing...");
    return false;
  }

  return true;
};