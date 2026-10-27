import React, { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarDays,
  Copy,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { showSuccessToast, showErrorToast } from "../ui/Toast";
import DeleteModal from "../patients/DeleteModel";
import { getAuthUser } from "../../utils/auth";
import {
  useGetLeaveTemplateByIdQuery,
  useDeleteLeaveTemplateMutation,
  useDuplicateLeaveTemplateMutation,
} from "../../../app/service/leaverequesttemplate";

const variables = [
  { key: "EMPLOYEE_NAME", label: "Employee name" },
  { key: "LEAVE_TYPE", label: "Leave type" },
  { key: "START_DATE", label: "Start date" },
  { key: "END_DATE", label: "End date" },
  { key: "TOTAL_DAYS", label: "Total days" },
  { key: "REASON", label: "Reason" },
  { key: "MANAGER_NAME", label: "Manager name" },
];

const ViewLeaveTemplate = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
  } = useGetLeaveTemplateByIdQuery(id, { skip: !id });

  const [deleteLeaveTemplate, { isLoading: isDeleting }] =
    useDeleteLeaveTemplateMutation();

  const [duplicateLeaveTemplate, { isLoading: isDuplicating }] =
    useDuplicateLeaveTemplateMutation();

  const template = response?.data;

  if (isLoading) {
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

  if (isError || !template || Array.isArray(template)) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">Template not found.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/leave-templates")}
              className="mt-4"
            >
              Back to Templates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/leave-templates/edit/${id}`);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteLeaveTemplate(id).unwrap();
      showSuccessToast("Leave request template deleted successfully.", 3000);
      setShowDeleteModal(false);
      navigate("/leave-templates");
    } catch (error) {
      console.error("Delete leave template error:", error);
      showErrorToast(
        error?.data?.message || "Failed to delete leave template.",
        3000
      );
    }
  };

  const handleDuplicate = async () => {
    try {
      const auth = getAuthUser();
      const employeeId =
        template.employeeId || auth?.employeeId || auth?.id;

      if (!employeeId) {
        showErrorToast(
          "Unable to identify employee. Please log in again.",
          3000
        );
        return;
      }

      await duplicateLeaveTemplate({
        id: template.id,
        employeeId,
        employeeType: template.employeeType || auth?.employeeType,
        templateName: `${template.templateName} (Copy)`,
      }).unwrap();

      showSuccessToast("Template duplicated successfully.", 3000);
      navigate("/leave-templates");
    } catch (error) {
      console.error("Duplicate leave template error:", error);
      showErrorToast(
        error?.data?.message || "Failed to duplicate template.",
        3000
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <CalendarDays size={23} className="text-indigo-600" />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-slate-800">
                    {template.templateName}
                  </h1>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      template.isPredefined
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {template.isPredefined ? "Predefined" : "Custom"}
                  </span>
                </div>

                <span className="inline-flex mt-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-medium">
                  {template.reasonCategory || "General"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {template.isPredefined && (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Copy size={16} />}
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                >
                  {isDuplicating ? "Copying..." : "Use This Template"}
                </Button>
              )}

              <Button
                variant="secondary"
                size="md"
                leftIcon={<Pencil size={16} />}
                onClick={handleEdit}
              >
                Edit Template
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<ArrowLeft size={16} />}
                onClick={() => navigate("/leave-templates")}
              >
                Back to Templates
              </Button>
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-12 border-b border-slate-200 pb-6">
            <div className="flex">
              <span className="w-28 text-xs font-semibold text-slate-500">
                Template Name
              </span>
              <span className="text-sm text-slate-700">
                {template.templateName}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 text-xs font-semibold text-slate-500">
                Last Updated At
              </span>
              <span className="text-sm text-slate-700">
                {template.updatedAt
                  ? new Date(template.updatedAt).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-28 text-xs font-semibold text-slate-500">
                Created At
              </span>
              <span className="text-sm text-slate-700">
                {template.createdAt
                  ? new Date(template.createdAt).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 text-xs font-semibold text-slate-500">
                Category
              </span>
              <span className="text-sm text-slate-700">
                {template.reasonCategory || "General"}
              </span>
            </div>
          </div>

          {/* MESSAGE */}
          <div className="grid grid-cols-12 gap-6 mt-6">
            <div className="col-span-12 lg:col-span-9">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">
                Message
              </h2>
              <div
                className="min-h-[360px] border border-slate-200 rounded-lg p-5 text-sm text-slate-700 leading-7 bg-white"
                dangerouslySetInnerHTML={{
                  __html: template.templateText || "",
                }}
              />
            </div>

            <div className="col-span-12 lg:col-span-3">
              <div className="bg-indigo-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-5">
                  Available Variables
                </h3>
                <div className="space-y-4">
                  {variables.map((variable) => (
                    <div key={variable.key} className="flex items-start gap-2">
                      <span className="min-w-[120px] text-[10px] font-semibold text-slate-700">
                        ({variable.key})
                      </span>
                      <span className="text-xs text-slate-500">
                        {variable.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!template.isPredefined && (
            <div className="border-t border-slate-200 mt-6 pt-5">
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={16} />}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Template
              </Button>
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Leave Request Template"
        message={`Are you sure you want to delete "${template.templateName}"? This action cannot be undone.`}
        itemName={template.templateName}
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </div>
  );
};

export default ViewLeaveTemplate;