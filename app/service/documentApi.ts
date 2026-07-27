// src/app/service/documentApi.ts
import { api } from "./api";
import { getUserRole, getAuthUser } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface Document {
  id?: string;
  _id?: string;
  patientId: string | number;
  name: string;
  date: string;
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  type?: string | null;
  role?: string | null;
  uploadedById?: string | number | null;
  contentType?: string | null;
  hospitalId?: string | number | null;
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDocumentData {
  patientId: string | number;
  name: string;
  date: string;
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  type?: string | null;
  role?: string | null;
  uploadedById?: string | number | null;
  contentType?: string | null;
  hospitalId?: string | number | null;
  uploadDate?: string;
}

export interface UpdateDocumentData {
  patientId: string | number;
  name: string;
  date: string;
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  type?: string | null;
  role?: string | null;
  uploadedById?: string | number | null;
  contentType?: string | null;
  hospitalId?: string | number | null; // ✅ ADDED hospitalId to UpdateDocumentData
}

export interface DocumentResponse {
  success?: boolean;
  message?: string;
  data?: Document | Document[];
  error?: string;
}

export interface GetDocumentsParams {
  patientId?: string | number;
  hospitalId?: string | number; // ✅ ADDED hospitalId filter
  page?: number;
  limit?: number;
  search_query?: string;
  skipHospitalFilter?: boolean; // ✅ ADDED skipHospitalFilter
}

// ==============================
// HELPER FUNCTIONS
// ==============================

// Helper: Get hospital ID from auth (returns number)
const getHospitalIdFromAuth = (auth: any): number | null => {
  if (!auth) return null;
  
  // Priority 1: Use hospitalId if available (this is the correct hospital ID)
  if (auth.hospitalId) {
    return Number(auth.hospitalId);
  }
  
  return null;
};

// Helper: Convert string | number to number safely
const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null) return undefined;
  return Number(value);
};

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
    return null;
  }
};

// ==============================
// DOCUMENTS API
// ==============================

export const documentsApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getDocuments: builder.query<DocumentResponse, GetDocumentsParams>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        const auth = getAuthUser();
        
        // Determine if user is super admin
        const isSuperAdmin = auth?.role === 'super-admin';
        const shouldSkipFilter = params.skipHospitalFilter === true;

        // Get hospital ID using helper
        let hospitalIdToUse = null;
        
        // For non-super-admin users, always filter by hospital if they have one
        if (!isSuperAdmin && !shouldSkipFilter) {
          hospitalIdToUse = getHospitalIdFromAuth(auth);
          
          // If no hospitalId found, try params
          if (!hospitalIdToUse && params.hospitalId) {
            hospitalIdToUse = toNumber(params.hospitalId);
          }
          
          if (hospitalIdToUse) {
            queryParams.append("hospitalId", String(hospitalIdToUse));
          } else {
            console.warn("⚠️ No hospital ID found for filtering documents");
          }
        } 
        // Super Admin with specific hospital filter
        else if (isSuperAdmin && params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }
        // Use provided hospitalId if specified (for cases where we want to override)
        else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

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

    getDocumentById: builder.query<DocumentResponse, string>({
      query: (id) => `/documents/${id}`,
      providesTags: (result, error, id) => [{ type: "Document", id }],
    }),

    createDocument: builder.mutation<DocumentResponse, CreateDocumentData>({
      query: (newDocument) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | null = null;
        
        if (!isSuperAdmin) {
          // Try to get from auth
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        // Use provided hospitalId if available, otherwise use from auth
        const finalHospitalId = newDocument.hospitalId || hospitalId;
        
        return {
          url: "/documents",
          method: "POST",
          body: {
            ...newDocument,
            hospitalId: finalHospitalId,
          },
        };
      },
      invalidatesTags: ["Document"],
    }),

    updateDocument: builder.mutation<DocumentResponse, { id: string; updateData: UpdateDocumentData }>({
      query: ({ id, updateData }) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | null = null;
        
        if (!isSuperAdmin) {
          // Try to get from auth
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        // Use provided hospitalId if available, otherwise use from auth
        const finalHospitalId = updateData.hospitalId || hospitalId;
        
        return {
          url: `/documents/${id}`,
          method: "PUT",
          body: {
            ...updateData,
            hospitalId: finalHospitalId,
          },
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Document", id }],
    }),

    deleteDocument: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),

    // ✅ UPDATED: uploadDocumentWithFile with hospitalId handling
    uploadDocumentWithFile: builder.mutation<
      DocumentResponse, 
      { 
        file: File; 
        patientId: string | number; 
        documentName: string; 
        date: string;
        hospitalId?: string | number; // ✅ ADDED optional hospitalId
      }
    >({
      async queryFn({ file, patientId, documentName, date, hospitalId }, _queryApi, _extraOptions, baseQuery) {
        try {
          const auth = getAuthUser();
          const isSuperAdmin = auth?.role === 'super-admin';
          const uploadedById = getUserIdFromStorage();
          const contentType = file.type;
          const userRole = auth?.role || "document";
          
          if (!uploadedById) {
            throw new Error("User ID is required for S3 upload. Please make sure you are logged in.");
          }
          
          // Get hospital ID from auth if not provided
          let finalHospitalId = hospitalId;
          if (!isSuperAdmin && !finalHospitalId) {
            const authHospitalId = getHospitalIdFromAuth(auth);
            if (authHospitalId) {
              finalHospitalId = authHospitalId;
            }
          }
          
          const timestamp = Date.now();
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileKey = `documents/${uploadedById}/${timestamp}_${safeFileName}`;
          
          const { uploadToS3 } = await import("./S3");
          
          // ✅ Pass uploadedById as customId and userRole as role
          const s3Result = await uploadToS3(
            file, 
            fileKey, 
            uploadedById,   // ← Pass uploadedById as customId
            userRole        // ← Pass user role
          );
          
          const documentData: CreateDocumentData = {
            patientId: patientId,
            name: documentName,
            date: date || new Date().toLocaleDateString(),
            fileKey: s3Result.key,
            fileUrl: s3Result.imageUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: formatFileSize(file.size),
            type: getFileExtension(file.name),
            role: userRole,
            uploadedById: uploadedById,
            contentType: contentType,
            hospitalId: finalHospitalId || null, // ✅ ADDED hospitalId
            uploadDate: new Date().toISOString(),
          };

          const result = await baseQuery({
            url: "/documents",
            method: "POST",
            body: documentData,
          });

          return { data: result.data as DocumentResponse };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["Document"],
    }),

  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentByIdQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useUploadDocumentWithFileMutation,
} = documentsApi;