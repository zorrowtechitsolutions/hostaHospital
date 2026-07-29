// src/app/service/labresults.ts

import { api } from "./api";
import { getUserRole, getAuthUser } from "../../src/utils/auth";

export interface LabResult {
  id?: string;
  _id?: string;
  patientId: string | number;
  patientName: string;
  name?: string;
  date?: string;
  labId?: string | number | null;
  labName?: string | null;
  hospitalId?: string | number | null;
  hospitalName: string;
  doctorId?: string | number | null;
  doctorName: string;
  department?: string | null;
  testName: string;
  status?: 'received' | 'progress' | 'pending'  | 'cancelled' | null;
  category?: string | null;
  referredBy?: string | null;
  appointmentDate?: string | null;
  result?: string | null;
  notes?: string | null;
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  type?: string | null;
  role?: string | null;
  uploadedById?: string | number | null;
  contentType?: string | null;
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLabResultData {
  patientId: string | number;
  patientName: string;
  name?: string;
  date?: string;
  labId?: string | number | null;
  labName?: string | null;
  hospitalId?: string | number | null;
  hospitalName: string;
  doctorId?: string | number | null;
  doctorName: string;
  department?: string | null;
  testName: string;
  status?: 'received' | 'progress' | 'pending'  | 'cancelled' | null;
  category?: string | null;
  referredBy?: string | null;
  appointmentDate?: string | null;
  result?: string | null;
  notes?: string | null;
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  type?: string | null;
  role?: string | null;
  uploadedById?: string | number | null;
  contentType?: string | null;
  uploadDate?: string;
}

export interface UpdateLabResultData {
  patientId: string | number;
  patientName: string;
  name?: string;
  date?: string;
  labId?: string | number | null;
  labName?: string | null;
  hospitalId?: string | number | null;
  hospitalName: string;
  doctorId?: string | number | null;
  doctorName: string;
  department?: string | null;
  testName: string;
  status?: 'received' | 'progress' | 'pending'  | 'cancelled' | null;
  category?: string | null;
  referredBy?: string | null;
  appointmentDate?: string | null;
  result?: string | null;
  notes?: string | null;
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  type?: string | null;
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
  skipHospitalFilter?: boolean;
}

// ================= HELPER FUNCTIONS =================

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


export const labResultsApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET LAB RESULTS =================
    getLabResults: builder.query<LabResultResponse, GetLabResultsParams>({
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
            console.warn("⚠️ No hospital ID found for filtering lab results");
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

        // Other filters
        if (params.patientId) {
          queryParams.append("patientId", String(params.patientId));
        }

        if (params.labId) {
          queryParams.append("labId", String(params.labId));
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

    // ================= GET LAB RESULT BY ID =================
    getLabResultById: builder.query<LabResultResponse, string>({
      query: (id) => `/lab-results/${id}`,
      providesTags: (result, error, id) => [{ type: "LabResult", id }],
    }),

    // ================= CREATE LAB RESULT =================
    createLabResult: builder.mutation<LabResultResponse, CreateLabResultData>({
      query: (newLabResult) => {
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
        const finalHospitalId = newLabResult.hospitalId || hospitalId;
        
        return {
          url: "/lab-results",
          method: "POST",
          body: {
            ...newLabResult,
            hospitalId: finalHospitalId,
          },
        };
      },
      invalidatesTags: ["LabResult"],
    }),

    // ================= UPDATE LAB RESULT =================
    updateLabResult: builder.mutation<LabResultResponse, { id: string; updateData: UpdateLabResultData }>({
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
          url: `/lab-results/${id}`,
          method: "PUT",
          body: {
            ...updateData,
            hospitalId: finalHospitalId,
          },
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "LabResult", id }],
    }),

    // ================= DELETE LAB RESULT =================
    deleteLabResult: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/lab-results/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LabResult"],
    }),

    // ================= RECOVER LAB RESULT =================
    recoverLabResult: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/lab-results/recover/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["LabResult"],
    }),

    // ================= UPLOAD LAB RESULT WITH FILE =================
    uploadLabResultWithFile: builder.mutation<
      LabResultResponse, 
      { 
        file: File; 
        patientId: string | number;
        patientName: string;
        testName: string; 
        date?: string; 
        labId?: string | number;
        labName?: string | null;
        hospitalId?: string | number;
        hospitalName: string;
        doctorId?: string | number;
        doctorName: string;
        department?: string;
        status?: 'received' | 'progress' | 'pending'  | 'cancelled';
        category?: string;
        referredBy?: string;
        appointmentDate?: string;
        result?: string;
        notes?: string;
      }
    >({
      async queryFn({ file, patientId, patientName, testName, date, labId, labName, hospitalId, hospitalName, doctorId, doctorName, department, status, category, referredBy, appointmentDate, result, notes }, _queryApi, _extraOptions, baseQuery) {
        try {
          const auth = getAuthUser();
          const isSuperAdmin = auth?.role === 'super-admin';
          const role = getUserRole()?.toLowerCase();
          const contentType = file.type;
          
          if (!patientName) {
            throw new Error("Patient name is required.");
          }
          
          if (!hospitalName) {
            throw new Error("Hospital name is required.");
          }
          
          if (!doctorName) {
            throw new Error("Doctor name is required.");
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

          
          const { uploadToS3 } = await import("./S3");
          const s3Result = await uploadToS3(file);
          
          const labResultData: CreateLabResultData = {
            patientId: patientId,
            patientName: patientName,
            name: testName,
            date: date || new Date().toLocaleDateString(),
            labId: labId || null,
            labName: labName || null,
            hospitalId: finalHospitalId || null,
            hospitalName: hospitalName,
            doctorId: doctorId || null,
            doctorName: doctorName,
            department: department || null,
            testName: testName,
            status: status || 'pending',
            fileKey: s3Result.key,
            fileUrl: s3Result.imageUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: formatFileSize(file.size),
            type: getFileExtension(file.name),
            role: role || null,
            contentType: contentType,
            uploadDate: new Date().toISOString(),
          };

          const result = await baseQuery({
            url: "/lab-results",
            method: "POST",
            body: labResultData,
          });

          return { data: result.data as LabResultResponse };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["LabResult"],
    }),

  }),
});

export const {
  useGetLabResultsQuery,
  useGetLabResultByIdQuery,
  useCreateLabResultMutation,
  useUpdateLabResultMutation,
  useDeleteLabResultMutation,
  useUploadLabResultWithFileMutation,
  useRecoverLabResultMutation,
} = labResultsApi;