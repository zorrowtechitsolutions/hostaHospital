// src/app/service/labResults.ts
import { api } from "./api";
import { getUserRole } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface LabResult {
  id?: string;
  _id?: string;
  patientId: string | number;
  name?: string;
  date?: string;
  labId?: string | number | null;
  hospitalId?: string | number | null;
  doctorId?: string | number | null;
  department?: string | null;
  testName: string;
  status?: 'received' | 'progress' | 'pending' | 'completed' | 'cancelled' | null;
  category?: string | null;
  referredBy?: string | null;
  appointmentDate?: string | null;
  result?: string | null;
  notes?: string | null;
  
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
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLabResultData {
  patientId: string | number;
  name?: string;
  date?: string;
  labId?: string | number | null;
  hospitalId?: string | number | null;
  doctorId?: string | number | null;
  department?: string | null;
  testName: string;
  status?: 'received' | 'progress' | 'pending' | 'completed' | 'cancelled' | null;
  category?: string | null;
  referredBy?: string | null;
  appointmentDate?: string | null;
  result?: string | null;
  notes?: string | null;
  
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
  uploadDate?: string;
}

export interface UpdateLabResultData {
  patientId: string | number;
  name?: string;
  date?: string;
  labId?: string | number | null;
  hospitalId?: string | number | null;
  doctorId?: string | number | null;
  department?: string | null;
  testName: string;
  status?: 'received' | 'progress' | 'pending' | 'completed' | 'cancelled' | null;
  category?: string | null;
  referredBy?: string | null;
  appointmentDate?: string | null;
  result?: string | null;
  notes?: string | null;
  
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

export interface LabResultResponse {
  success?: boolean;
  message?: string;
  data?: LabResult | LabResult[];
  error?: string;
}

export interface GetLabResultsParams {
  patientId?: string | number;
  labId?: string | number;
  hospitalId?: string | number;
  doctorId?: string | number;
  department?: string;
  status?: string;
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
// LAB RESULTS API
// ==============================

export const labResultsApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ==============================
    // GET ALL LAB RESULTS
    // ==============================

    getLabResults: builder.query<LabResultResponse, GetLabResultsParams>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.patientId) {
          queryParams.append("patientId", String(params.patientId));
        }

        if (params.labId) {
          queryParams.append("labId", String(params.labId));
        }

        if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params.doctorId) {
          queryParams.append("doctorId", String(params.doctorId));
        }

        if (params.department) {
          queryParams.append("department", params.department);
        }

        if (params.status) {
          queryParams.append("status", params.status);
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
          ? `/lab-results?${queryParams.toString()}`
          : "/lab-results";
      },
      providesTags: ["LabResult"],
    }),

    // ==============================
    // GET SINGLE LAB RESULT
    // ==============================

    getLabResultById: builder.query<LabResultResponse, string>({
      query: (id) => `/lab-results/${id}`,
      providesTags: (result, error, id) => [{ type: "LabResult", id }],
    }),

    // ==============================
    // CREATE NEW LAB RESULT
    // ==============================

    createLabResult: builder.mutation<LabResultResponse, CreateLabResultData>({
      query: (newLabResult) => ({
        url: "/lab-results",
        method: "POST",
        body: newLabResult,
      }),
      invalidatesTags: ["LabResult"],
    }),

    // ==============================
    // UPDATE LAB RESULT
    // ==============================

    updateLabResult: builder.mutation<LabResultResponse, { id: string; updateData: UpdateLabResultData }>({
      query: ({ id, updateData }) => ({
        url: `/lab-results/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "LabResult", id }],
    }),

    // ==============================
    // DELETE LAB RESULT
    // ==============================

    deleteLabResult: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/lab-results/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LabResult"],
    }),

    // ==============================
    // UPLOAD LAB RESULT WITH FILE
    // ==============================

    uploadLabResultWithFile: builder.mutation<
      LabResultResponse, 
      { 
        file: File; 
        patientId: string | number; 
        testName: string; 
        date?: string; 
        labId?: string | number;
        hospitalId?: string | number;
        doctorId?: string | number;
        department?: string;
        status?: 'received' | 'progress' | 'pending' | 'completed' | 'cancelled';
        category?: string;
        referredBy?: string;
        appointmentDate?: string;
        result?: string;
        notes?: string;
      }
    >({
      async queryFn({ file, patientId, testName, date, labId, hospitalId, doctorId, department, status, category, referredBy, appointmentDate, result, notes }, _queryApi, _extraOptions, baseQuery) {
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
          const fileKey = `lab-results/${userId}/${timestamp}_${safeFileName}`;
          
          // Import S3 upload function dynamically
          const { uploadToS3 } = await import("./S3");
          const s3Result = await uploadToS3(file, fileKey);
          
          // Prepare lab result data with all S3 metadata
          const labResultData: CreateLabResultData = {
            patientId: patientId,
            name: testName,
            date: date || new Date().toLocaleDateString(),
            labId: labId || null,
            hospitalId: hospitalId || null,
            doctorId: doctorId || null,
            department: department || null,
            testName: testName,
            status: status || 'pending',
            
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

          console.log("📄 Lab Result Data being saved:", labResultData);

          const result = await baseQuery({
            url: "/lab-results",
            method: "POST",
            body: labResultData,
          });

          return { data: result.data as LabResultResponse };
        } catch (error: any) {
          console.error("Error uploading lab result with file:", error);
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["LabResult"],
    }),

  }),
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetLabResultsQuery,
  useGetLabResultByIdQuery,
  useCreateLabResultMutation,
  useUpdateLabResultMutation,
  useDeleteLabResultMutation,
  useUploadLabResultWithFileMutation,
} = labResultsApi;