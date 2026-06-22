// src/app/service/documents.ts
import { api } from "./api";
import { getUserRole } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface Document {
  id?: string;
  _id?: string;
  patientId: string | number;
  name: string;
  date: string;
  
  // S3 File Metadata
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  type?: string | null;
  
  // S3 Upload Metadata
  role?: string | null;
  uploadedById?: string | number | null;
  contentType?: string | null;
  
  // Additional Fields
  hospitalId?: string | number | null;
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDocumentData {
  patientId: string | number;
  name: string;
  date: string;
  
  // S3 File Metadata
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  type?: string | null;
  
  // S3 Upload Metadata
  role?: string | null;
  uploadedById?: string | number | null;
  contentType?: string | null;
  
  // Additional Fields
  hospitalId?: string | number | null;
  uploadDate?: string;
}

export interface UpdateDocumentData {
  patientId: string | number;
  name: string;
  date: string;
  
  // S3 File Metadata
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  type?: string | null;
  
  // S3 Upload Metadata
  role?: string | null;
  uploadedById?: string | number | null;
  contentType?: string | null;
}

export interface DocumentResponse {
  success?: boolean;
  message?: string;
  data?: Document | Document[];
  error?: string;
}

export interface GetDocumentsParams {
  patientId?: string | number;
  page?: number;
  limit?: number;
  search_query?: string;
}

// ==============================
// HELPER FUNCTIONS
// ==============================

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toUpperCase() || '';
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getUserIdFromStorage = (): string | number | null => {
  try {
    const auth = JSON.parse(localStorage.getItem("user") || "{}");
    return auth.id || auth.userId || auth.staffId || auth.doctorId || auth.hospitalId || null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

// ==============================
// DOCUMENTS API
// ==============================

export const documentsApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ==============================
    // GET ALL DOCUMENTS
    // ==============================

    getDocuments: builder.query<DocumentResponse, GetDocumentsParams>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.patientId) {
          queryParams.append("patientId", String(params.patientId));
        }

        if (params.page) {
          queryParams.append("page", String(params.page));
        }

        if (params.limit) {
          queryParams.append("limit", String(params.limit));
        }

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        return queryParams.toString()
          ? `/documents?${queryParams.toString()}`
          : "/documents";
      },
      providesTags: ["Document"],
    }),

    // ==============================
    // GET SINGLE DOCUMENT
    // ==============================

    getDocumentById: builder.query<DocumentResponse, string>({
      query: (id) => `/documents/${id}`,
      providesTags: (result, error, id) => [{ type: "Document", id }],
    }),

    // ==============================
    // CREATE NEW DOCUMENT
    // ==============================

    createDocument: builder.mutation<DocumentResponse, CreateDocumentData>({
      query: (newDocument) => ({
        url: "/documents",
        method: "POST",
        body: newDocument,
      }),
      invalidatesTags: ["Document"],
    }),

    // ==============================
    // UPDATE DOCUMENT
    // ==============================

    updateDocument: builder.mutation<DocumentResponse, { id: string; updateData: UpdateDocumentData }>({
      query: ({ id, updateData }) => ({
        url: `/documents/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Document", id }],
    }),

    // ==============================
    // DELETE DOCUMENT
    // ==============================

    deleteDocument: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),

    // ==============================
    // UPLOAD DOCUMENT WITH FILE
    // ==============================

    uploadDocumentWithFile: builder.mutation<
      DocumentResponse, 
      { 
        file: File; 
        patientId: string | number; 
        documentName: string; 
        date: string; 
      }
    >({
      async queryFn({ file, patientId, documentName, date }, _queryApi, _extraOptions, baseQuery) {
        try {
          // Get user role and ID for S3 upload
          const role = getUserRole()?.toLowerCase();
          const uploadedById = getUserIdFromStorage();
          const contentType = file.type;
          
          // Use userId for the folder structure
          const userId = uploadedById;
          
          if (!userId) {
            throw new Error("User ID is required for S3 upload. Please make sure you are logged in.");
          }
          
          const timestamp = Date.now();
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileKey = `documents/${userId}/${timestamp}_${safeFileName}`;
          
          // Import S3 upload function dynamically
          const { uploadToS3 } = await import("./S3");
          const s3Result = await uploadToS3(file, fileKey);
          
          // Prepare document data with all S3 metadata
          const documentData: CreateDocumentData = {
            patientId: patientId,
            name: documentName,
            date: date || new Date().toLocaleDateString(),
            
            // S3 File Metadata
            fileKey: s3Result.key,
            fileUrl: s3Result.imageUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: formatFileSize(file.size),
            type: getFileExtension(file.name),
            
            // S3 Upload Metadata
            role: role || null,
            uploadedById: uploadedById,
            contentType: contentType,
            
            // Additional Fields
            uploadDate: new Date().toISOString(),
          };

          console.log("📄 Document Data being saved:", documentData);

          const result = await baseQuery({
            url: "/documents",
            method: "POST",
            body: documentData,
          });

          return { data: result.data as DocumentResponse };
        } catch (error: any) {
          console.error("Error uploading document with file:", error);
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["Document"],
    }),

  }),
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetDocumentsQuery,
  useGetDocumentByIdQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useUploadDocumentWithFileMutation,
} = documentsApi;