import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import LeaveTemplateForm from "./LeaveTemplateForm";
import { showSuccessToast, showErrorToast } from "../ui/Toast";
import {
  useGetLeaveTemplateByIdQuery,
  useUpdateLeaveTemplateMutation,
} from "../../../app/service/leaverequesttemplate";

const EditLeaveTemplate = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data: response,
    isLoading: isFetching,
    isError,
  } = useGetLeaveTemplateByIdQuery(id, { skip: !id });

  const [updateLeaveTemplate, { isLoading: isUpdating }] =
    useUpdateLeaveTemplateMutation();

  if (isFetching) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  const apiTemplate = response?.data;
  if (isError || !apiTemplate || Array.isArray(apiTemplate)) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">Template not found.</p>
            <button
              onClick={() => navigate("/leave-templates")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
            >
              Back to Templates
            </button>
          </div>
        </div>
      </div>
    );
  }

  const template = {
    templateName: apiTemplate.templateName || "",
    category: apiTemplate.reasonCategory || "",
    message: apiTemplate.templateText || "",
    status: "Active",
  };

  const handleSave = async (formData) => {
    try {
      const payload = {
        templateName: formData.templateName,
        reasonCategory: formData.category,
        templateText: formData.message,
      };

      await updateLeaveTemplate({ id, data: payload }).unwrap();

      showSuccessToast("Leave request template updated successfully.", 3000);
      navigate("/leave-templates");
    } catch (error) {
      console.error("Update leave template error:", error);
      showErrorToast(
        error?.data?.message || "Failed to update leave template.",
        3000
      );
    }
  };

  return (
    <LeaveTemplateForm
      mode="edit"
      initialData={template}
      onSave={handleSave}
      onCancel={() => navigate("/leave-templates")}
      isLoading={isUpdating}
    />
  );
};

export default EditLeaveTemplate;