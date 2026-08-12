import React from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import EmailTemplateForm from "./EmailTemplateForm";
import {
  useGetTemplateByIdQuery,
  useUpdateTemplateMutation,
} from "../../../app/service/emailtemplate";
import { showSuccessToast, showErrorToast } from "../ui/Toast";

const EditEmailTemplate = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Get existing template
  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetTemplateByIdQuery(id, {
    skip: !id,
  });

  // Update template
  const [
    updateTemplate,
    {
      isLoading: isUpdating,
    },
  ] = useUpdateTemplateMutation();

  // ============================
  // LOADING
  // ============================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading email template...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // ERROR
  // ============================

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <p className="text-sm text-red-500 mb-4">
              {error?.data?.message ||
                "Failed to load email template."}
            </p>

            <button
              onClick={() =>
                navigate("/email-templates")
              }
              className="
                px-4 py-2
                bg-indigo-600
                text-white
                rounded-lg
                text-sm
              "
            >
              Back to Templates
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // API DATA
  // ============================

  const apiTemplate = data?.data;

  if (!apiTemplate) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">
              Template not found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // CONVERT API DATA TO FORM DATA
  // ============================

  const template = {
    templateName: apiTemplate.templateName || apiTemplate.name || "",
    category: apiTemplate.category || "",
    subject: apiTemplate.subject || "",
    message: apiTemplate.message || apiTemplate.body || "",
    status: apiTemplate.status || "Active",
  };

  // ============================
  // UPDATE
  // ============================

  const handleSave = async (formData) => {
    try {
      const payload = {
        templateName: formData.templateName,
        subject: formData.subject,
        message: formData.message,
        category: formData.category,
        status: formData.status,
      };

      // Debug log to verify payload
      console.log("UPDATE PAYLOAD:", payload);

      await updateTemplate({
        id,
        data: payload,
      }).unwrap();

      showSuccessToast("Email template updated successfully.", 3000);

      navigate("/email-templates");
    } catch (error) {
      console.error("Update template error:", error);

      showErrorToast(
        error?.data?.message ||
          error?.message ||
          "Failed to update email template.",
        3000
      );
    }
  };

  return (
    <EmailTemplateForm
      mode="edit"
      initialData={template}
      onSave={handleSave}
      onCancel={() => navigate("/email-templates")}
      isLoading={isUpdating}
    />
  );
};

export default EditEmailTemplate;