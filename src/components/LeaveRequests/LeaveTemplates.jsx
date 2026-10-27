import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  AlertTriangle,
  GraduationCap,
  FileText,
  RefreshCcw,
  Copy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Pagination } from "../ui/Pagination";
import CustomSelect from "../ui/CustomSelect";
import { showSuccessToast, showErrorToast } from "../ui/Toast";
import DeleteModal from "../patients/DeleteModel";
import { getAuthUser } from "../../utils/auth";
import {
  useGetLeaveTemplatesQuery,
  useDeleteLeaveTemplateMutation,
  useDuplicateLeaveTemplateMutation,
} from "../../../app/service/leaverequesttemplate";

const categoryStyles = {
  "Annual Leave": "bg-indigo-50 text-indigo-600",
  "Sick Leave": "bg-red-50 text-red-500",
  "Casual Leave": "bg-sky-50 text-sky-600",
  "Maternity Leave": "bg-amber-50 text-amber-600",
};

// ✅ Options for the Category filter — "All Categories" is a real value (default + reset)
const CATEGORY_OPTIONS = [
  { value: "All Categories", label: "All Categories" },
  { value: "Annual Leave", label: "Annual Leave" },
  { value: "Sick Leave", label: "Sick Leave" },
  { value: "Casual Leave", label: "Casual Leave" },
  { value: "Maternity Leave", label: "Maternity Leave" },
];

// ✅ Options for the Status filter — "All Statuses" is a real value
const STATUS_OPTIONS = [
  { value: "All Statuses", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

// Styling override so CustomSelect matches the h-10 / border-slate-200 inputs
const SELECT_FILTER_CLASS =
  "w-44 [&>button]:h-10 [&>button]:border-slate-200 [&>button]:text-sm [&>button]:text-slate-600 [&>button]:px-4";

const getIconForCategory = (category) => {
  const map = {
    "Annual Leave": CalendarDays,
    "Sick Leave": AlertTriangle,
    "Casual Leave": GraduationCap,
    "Maternity Leave": FileText,
  };
  return map[category] || CalendarDays;
};

const getIconStyles = (category) => {
  const map = {
    "Annual Leave": { bg: "bg-indigo-50", color: "text-indigo-600" },
    "Sick Leave": { bg: "bg-red-50", color: "text-red-500" },
    "Casual Leave": { bg: "bg-sky-50", color: "text-sky-600" },
    "Maternity Leave": { bg: "bg-amber-50", color: "text-amber-600" },
  };
  return map[category] || { bg: "bg-slate-50", color: "text-slate-600" };
};

const LeaveTemplates = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetLeaveTemplatesQuery({
    search: search || undefined,
    reasonCategory: category !== "All Categories" ? category : undefined,
  });

  const [deleteLeaveTemplate, { isLoading: isDeleting }] =
    useDeleteLeaveTemplateMutation();

  const [duplicateLeaveTemplate, { isLoading: isDuplicating }] =
    useDuplicateLeaveTemplateMutation();

  const templates = useMemo(() => {
    const data = response?.data;
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }, [response]);

  const filtered = useMemo(() => {
    if (status === "All Statuses") return templates;
    return templates.filter(
      (t) => (t.status || "Active") === status
    );
  }, [templates, status]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, category, status]);

  const handleView = (t) => navigate(`/leave-templates/view/${t.id}`);
  const handleEdit = (t) => navigate(`/leave-templates/edit/${t.id}`);

  const handleDeleteClick = (t) => {
    setTemplateToDelete(t);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    try {
      await deleteLeaveTemplate(templateToDelete.id).unwrap();
      showSuccessToast("Leave request template deleted successfully.", 3000);
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      showErrorToast(
        error?.data?.message || "Failed to delete template.",
        3000
      );
    }
  };

  const handleDuplicate = async (template) => {
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
    } catch (error) {
      console.error("Duplicate error:", error);
      showErrorToast(
        error?.data?.message || "Failed to duplicate template.",
        3000
      );
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setCategory("All Categories");
    setStatus("All Statuses");
    setPage(1);
    refetch();
    showSuccessToast("Refreshed template list", 2000);
  };

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setPage(p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 font-sans">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Leave Templates</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Leave Request Template Management</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">
          Leave Request Template Management
        </h1>
      </div>

      {/* Header / Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto flex-wrap items-start">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates by name..."
              className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* ✅ Replaced native  (Category) with CustomSelect */}
          <CustomSelect
            hideLabel
            value={category}
            options={CATEGORY_OPTIONS}
            onChange={(value) => setCategory(value)}
            className={SELECT_FILTER_CLASS}
          />

          {/* ✅ Replaced native  (Status) with CustomSelect */}
          <CustomSelect
            hideLabel
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => setStatus(value)}
            className={SELECT_FILTER_CLASS}
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={handleRefresh}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={16} />
          </button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={17} />}
            onClick={() => navigate("/leave-templates/create")}
          >
            Create Template
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            Total Templates
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
              {totalItems}
            </span>
          </h2>
        </div>

        <div className="flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Template Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Last Updated</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <p className="text-sm text-gray-500">
                        Loading templates...
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((template) => {
                    const Icon = getIconForCategory(template.reasonCategory);
                    const iconStyles = getIconStyles(template.reasonCategory);
                    const rowStatus = template.status || "Active";

                    return (
                      <tr
                        key={template.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconStyles.bg}`}
                            >
                              <Icon size={18} className={iconStyles.color} />
                            </div>
                            <div>
                              <p
                                onClick={() => handleView(template)}
                                className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-indigo-600"
                              >
                                {template.templateName}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {template.reasonCategory || "Uncategorized"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              categoryStyles[template.reasonCategory] ||
                              "bg-slate-50 text-slate-500"
                            }`}
                          >
                            {template.reasonCategory || "General"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              template.isPredefined
                                ? "bg-indigo-50 text-indigo-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {template.isPredefined ? "Predefined" : "Custom"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600">
                            {template.updatedAt
                              ? new Date(template.updatedAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          {/* ✅ Now reflects template.status instead of hardcoding "Active" */}
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              rowStatus === "Active"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {rowStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleView(template)}
                              title="View"
                              className="p-1.5 rounded hover:bg-gray-100 text-slate-400 hover:text-indigo-600 transition"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(template)}
                              title="Edit"
                              className="p-1.5 rounded hover:bg-gray-100 text-slate-400 hover:text-indigo-600 transition"
                            >
                              <Pencil size={16} />
                            </button>

                            {template.isPredefined && (
                              <button
                                onClick={() => handleDuplicate(template)}
                                title="Use This Template"
                                disabled={isDuplicating}
                                className="p-1.5 rounded hover:bg-gray-100 text-slate-400 hover:text-emerald-600 transition disabled:opacity-50"
                              >
                                <Copy size={16} />
                              </button>
                            )}

                            {!template.isPredefined && (
                              <button
                                onClick={() => handleDeleteClick(template)}
                                title="Delete"
                                className="p-1.5 rounded hover:bg-gray-100 text-slate-400 hover:text-red-600 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {!isLoading && !isFetching && paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No templates found
                      </h3>
                      <p className="text-sm text-gray-500">
                        Try adjusting your search or filter criteria
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={limit}
              itemLabel="templates"
            />
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTemplateToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Leave Request Template"
        message={
          templateToDelete
            ? `Are you sure you want to delete "${templateToDelete.templateName}"? This action cannot be undone.`
            : "Are you sure you want to delete this template?"
        }
        itemName={templateToDelete?.templateName}
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </div>
  );
};

export default LeaveTemplates;