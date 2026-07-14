// src/app/service/labresults.ts

import { api } from "./api";
import { getUserRole } from "../../src/utils/auth";

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
  status?: 'received' | 'progress' | 'pending' | 'completed' | 'cancelled' | null;
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
  status?: 'received' | 'progress' | 'pending' | 'completed' | 'cancelled' | null;
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
  status?: 'received' | 'progress' | 'pending' | 'completed' | 'cancelled' | null;
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
}

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

export const labResultsApi = api.injectEndpoints({
  endpoints: (builder) => ({

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

    getLabResultById: builder.query<LabResultResponse, string>({
      query: (id) => `/lab-results/${id}`,
      providesTags: (result, error, id) => [{ type: "LabResult", id }],
    }),

    createLabResult: builder.mutation<LabResultResponse, CreateLabResultData>({
      query: (newLabResult) => ({
        url: "/lab-results",
        method: "POST",
        body: newLabResult,
      }),
      invalidatesTags: ["LabResult"],
    }),

    updateLabResult: builder.mutation<LabResultResponse, { id: string; updateData: UpdateLabResultData }>({
      query: ({ id, updateData }) => ({
        url: `/lab-results/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "LabResult", id }],
    }),

    deleteLabResult: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/lab-results/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LabResult"],
    }),

    // 👇 NEW: Recover Lab Result
    recoverLabResult: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/lab-results/recover/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["LabResult"],
    }),

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
        status?: 'received' | 'progress' | 'pending' | 'completed' | 'cancelled';
        category?: string;
        referredBy?: string;
        appointmentDate?: string;
        result?: string;
        notes?: string;
      }
    >({
      async queryFn({ file, patientId, patientName, testName, date, labId, labName, hospitalId, hospitalName, doctorId, doctorName, department, status, category, referredBy, appointmentDate, result, notes }, _queryApi, _extraOptions, baseQuery) {
        try {
          const role = getUserRole()?.toLowerCase();
          const uploadedById = getUserIdFromStorage();
          const contentType = file.type;
          const userId = uploadedById;
          
          if (!userId) {
            throw new Error("User ID is required for S3 upload. Please make sure you are logged in.");
          }
          
          if (!patientName) {
            throw new Error("Patient name is required.");
          }
          
          if (!hospitalName) {
            throw new Error("Hospital name is required.");
          }
          
          if (!doctorName) {
            throw new Error("Doctor name is required.");
          }
          
          const timestamp = Date.now();
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileKey = `lab-results/${userId}/${timestamp}_${safeFileName}`;
          
          const { uploadToS3 } = await import("./S3");
          const s3Result = await uploadToS3(file, fileKey);
          
          const labResultData: CreateLabResultData = {
            patientId: patientId,
            patientName: patientName,
            name: testName,
            date: date || new Date().toLocaleDateString(),
            labId: labId || null,
            labName: labName || null,
            hospitalId: hospitalId || null,
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
            uploadedById: uploadedById,
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
  useRecoverLabResultMutation, // 👈 Added
} = labResultsApi;  