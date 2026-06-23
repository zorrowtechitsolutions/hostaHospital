// app/service/s3.ts

import {
  getHospitalId,
  getUserRole,
  getToken,
} from "../../src/utils/auth";

const API_URL =
  "https://zorrowtek.in/api/presignurl";

export const S3_BASE_URL =
  "https://hostahealthcare.s3.eu-north-1.amazonaws.com";

interface UploadResponse {
  imageUrl: string;
  key: string;
}

// ========================
// GET FULL IMAGE URL
// ========================

export const getS3ImageUrl = (
  key?: string | null
) => {
  if (!key) return null;

  if (
    key.startsWith("http://") ||
    key.startsWith("https://")
  ) {
    return key;
  }

  return `${S3_BASE_URL}/${encodeURIComponent(
    key
  )}`;
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
        const canvas =
          document.createElement("canvas");

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height =
            (height * maxWidth) /
            width;

          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext("2d");

        ctx?.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            resolve(
              new File(
                [blob],
                file.name,
                {
                  type:
                    "image/jpeg",
                }
              )
            );
          },
          "image/jpeg",
          quality
        );
      };

      img.src =
        reader.result as string;
    };

    reader.readAsDataURL(file);
  });
};

// ========================
// GET USER ID BASED ON ROLE
// ========================

const getUserId = () => {
  const auth = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const role = getUserRole()?.toLowerCase();

  console.log("=== getUserId DEBUG ===");
  console.log("Auth object:", auth);
  console.log("Role:", role);

  let userId = null;

  switch (role) {
    case "doctor":
      userId = auth.doctorId || auth.id;
      break;
    case "staff":
      userId = auth.staffId || auth.id;
      break;
    case "hospital":
      userId = auth.hospitalId || auth.id;
      break;
    case "super_admin":
    case "superadmin":
    case "admin":
      userId = auth.hospitalId || getHospitalId() || auth.id;
      console.log("Super Admin - Using ID:", userId);
      break;
    default:
      userId = auth.id || auth.userId || auth.hospitalId || getHospitalId();
      break;
  }

  console.log("Final User ID:", userId);
  console.log("=======================");
  
  return userId;
};

// ========================
// UPLOAD    
// ========================

export const uploadToS3 = async (
  file: File,
  key: string | null = null,
  customId?: number | string,
  customRole?: string  // Allow custom role like "documents"
): Promise<UploadResponse> => {
  try {
    const role = customRole || getUserRole()?.toLowerCase() || "hospital";
    const token = getToken();

    // Get user ID based on role
const hospitalId = getHospitalId();
const userId = hospitalId;
    // Get ID - use provided id or get from storage
    let id = customId || getUserId();
    
    // For Super Admin, if id is still undefined, try to get hospitalId
    if (!id && (role === 'super_admin' || role === 'superadmin' || role === 'admin')) {
      id = getHospitalId();
      console.log("Super Admin fallback - Using hospitalId from getHospitalId():", id);
    }

    // COMPRESS
    const compressed = await compressImage(file);

    console.log("=== S3 UPLOAD DEBUG ===");
    console.log("Original size:", (file.size / 1024 / 1024).toFixed(2), "MB");
    console.log("Compressed size:", (compressed.size / 1024 / 1024).toFixed(2), "MB");
    console.log("Role:", role);
    console.log("ID:", id);
    console.log("Custom ID passed:", customId);
    console.log("Custom Role passed:", customRole);
    console.log("Token exists:", !!token);
    console.log("Existing key:", key);

    // Validate required fields
    if (!id) {
      throw new Error("ID is required for S3 upload. Please make sure you are logged in.");
    }

    const body = {
      filename: compressed.name,
      contentType: compressed.type,
      role: role, // doctor / staff / hospital / super_admin / documents
      id: id,
      ...(key
        ? { key }
        : { size: compressed.size }),
    };

    console.log("Request body:", JSON.stringify(body, null, 2));

    const res = await fetch(API_URL, {
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
      } catch (e) {
        errorText = "Could not read error response";
      }
      
      console.error("Presign API Error Response:", {
        status: res.status,
        statusText: res.statusText,
        body: errorText
      });
      
      throw new Error(`Presign failed (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    console.log("Presign response:", data);

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
        statusText: upload.statusText
      });
      throw new Error(`Upload to S3 failed: ${upload.statusText}`);
    }

    console.log("Upload successful! Key:", data.key);

    return {
      key: data.key,
      imageUrl: getS3ImageUrl(data.key) as string,
    };
  } catch (err) {
    console.error("S3 Upload Error:", err);
    throw err;
  }
};

// ========================
// DELETE
// ========================

export const deleteFromS3 = async (key: string, role?: string, id?: string | number) => {
  const token = getToken();
  const finalRole = role || getUserRole() || "hospital";
  let finalId = id || getUserId();
  
  if (!finalId && (finalRole === 'super_admin' || finalRole === 'superadmin' || finalRole === 'admin')) {
    finalId = getHospitalId();
    console.log("Super Admin delete - Using hospitalId:", finalId);
  }

  console.log("=== S3 DELETE DEBUG ===");
  console.log("Key:", key);
  console.log("Role:", finalRole);
  console.log("ID:", finalId);
  console.log("Token exists:", !!token);

  if (!finalId) {
    console.warn("No ID found for delete operation");
    return true;
  }

  const res = await fetch(API_URL, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      key,
      role: finalRole,
      id: finalId,
    }),
  });

  if (!res.ok) {
    let errorText = "";
    try {
      errorText = await res.text();
    } catch (e) {
      errorText = "Could not read error response";
    }
    
    console.error("Delete from S3 failed:", {
      status: res.status,
      statusText: res.statusText,
      body: errorText
    });
    
    console.warn("Delete failed, but continuing...");
    return false;
  }

  console.log("Delete successful!");
  return true;
};