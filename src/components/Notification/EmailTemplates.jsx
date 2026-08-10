import React, { useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Users,
  CalendarDays,
  AlertTriangle,
  GraduationCap,
  Wrench,
  FileText,
  RefreshCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetTemplatesQuery,
  useDeleteTemplateMutation,
} from "../../../app/service/emailtemplate";
import { Button } from "../ui/button";
import { Pagination } from "../ui/Pagination";
import { showSuccessToast, showErrorToast } from "../ui/Toast";

const categoryStyles = {
  General: "bg-indigo-50 text-indigo-600",
  Alert: "bg-red-50 text-red-500",
  Training: "bg-sky-50 text-sky-600",
  Information: "bg-amber-50 text-amber-600",
};

// Map category to icon
const getIconForCategory = (category) => {
  const map = {
    General: Users,
    Alert: AlertTriangle,
    Training: GraduationCap,
    Information: FileText,
  };
  return map[category] || Users;
};

const getIconStyles = (category) => {
  const map = {
    General: { bg: "bg-indigo-50", color: "text-indigo-600" },
    Alert: { bg: "bg-red-50", color: "text-red-500" },
    Training: { bg: "bg-sky-50", color: "text-sky-600" },
    Information: { bg: "bg-amber-50", color: "text-amber-600" },
  };
  return map[category] || { bg: "bg-slate-50", color: "text-slate-600" };
};

// Skeleton Loading Component
const TemplateSkeleton = () => {
  return (
    <div className="min-h-screen bg-white p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="h-10 w-64 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-56 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-28 h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[...Array(6)].map((_, i) => (
                  <th key={i} className="px-5 py-3.5">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const EmailTemplates = () => {
  const navigate = useNavigate();
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const limit = 10;

  // ============================
  // API QUERIES
  // ============================

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetTemplatesQuery({
    search_query: search || undefined,
    category: category === "All Categories" ? undefined : category,
    status: status === "All Statuses" ? "all" : status,
    page: page,
    limit: limit,
  });

  const [
    deleteTemplateApi,
    { isLoading: isDeleting },
  ] = useDeleteTemplateMutation();

  // ============================
  // DATA PROCESSING
  // ============================

  const templates = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination;
  const totalItems = pagination?.total || templates.length;
  const totalPages = pagination?.pages || Math.ceil(totalItems / limit) || 1;

  // ============================
  // HANDLERS
  // ============================

  const handleView = (template) => {
    navigate(`/email-templates/view/${template.id}`);
  };

  const handleEdit = (template) => {
    navigate(`/email-templates/edit/${template.id}`);
  };

  const handleDelete = async (id, templateName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the template "${templateName}"?`
    );

    if (!confirmed) return;

    try {
      await deleteTemplateApi(id).unwrap();
      showSuccessToast("Email template deleted successfully.", 3000);
      refetch();
    } catch (error) {
      console.error("Delete template error:", error);
      showErrorToast(
        error?.data?.message || "Failed to delete email template.",
        3000
      );
    }
  };

  const handleCreate = () => {
    navigate("/email-templates/create");
  };

  const handleRefresh = () => {
    setSearch("");
    setCategory("All Categories");
    setStatus("All Statuses");
    setPage(1);
    refetch();
    showSuccessToast("Refreshed template list", 2000);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, category, status]);

  // ============================
  // RENDER
  // ============================

  if (isLoading) {
    return <TemplateSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-sm text-red-500">
            {error?.data?.message ||
              "Failed to load email templates."}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => refetch()}
            className="mt-3"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 font-sans">

      {/* ================= BREADCRUMB ================= */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Email Templates</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Email Template Management</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Email Template Management</h1>
      </div>

      {/* ================= HEADER & ACTIONS ================= */}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">

        <div className="flex flex-1 gap-3 w-full lg:w-auto flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates by name or subject..."
              className="
                w-full h-10 pl-10 pr-4
                border border-slate-200
                rounded-lg
                text-sm
                text-slate-700
                placeholder:text-slate-400
                outline-none
                focus:border-indigo-400
                focus:ring-2
                focus:ring-indigo-100
              "
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="
              h-10
              w-44
              px-4
              border border-slate-200
              rounded-lg
              bg-white
              text-sm
              text-slate-600
              outline-none
              focus:border-indigo-400
            "
          >
            <option>All Categories</option>
            <option>General</option>
            <option>Alert</option>
            <option>Training</option>
            <option>Information</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="
              h-10
              w-44
              px-4
              border border-slate-200
              rounded-lg
              bg-white
              text-sm
              text-slate-600
              outline-none
              focus:border-indigo-400
            "
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={handleRefresh}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={17} />}
            onClick={handleCreate}
          >
            Create Template
          </Button>
        </div>

      </div>

      {/* ================= TABLE WITH STICKY PAGINATION ================= */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">

        {/* Table Header with Total Count */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            Total Templates
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
              {totalItems}
            </span>
          </h2>
        </div>

        {/* Table Container with min-height for consistent layout */}
        <div className="flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">

              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Template Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Last Updated</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center w-24">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {templates.map((template) => {
                  const Icon = getIconForCategory(template.category);
                  const iconStyles = getIconStyles(template.category);

                  return (
                    <tr
                      key={template.id}
                      className="hover:bg-gray-50 transition"
                    >

                      {/* Template Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                              w-9 h-9
                              rounded-lg
                              flex items-center justify-center
                              ${iconStyles.bg}
                            `}
                          >
                            <Icon size={18} className={iconStyles.color} />
                          </div>
                          <div>
                            <p
                              onClick={() => handleView(template)}
                              className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-indigo-600"
                            >
                              {template.templateName || template.name}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {template.category || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span
                          className={`
                            inline-flex
                            px-2.5 py-1
                            rounded-full
                            text-[11px]
                            font-medium
                            ${categoryStyles[template.category] || "bg-slate-50 text-slate-500"}
                          `}
                        >
                          {template.category || "General"}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 max-w-[200px] truncate block">
                          {template.subject}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {template.updatedAt
                            ? new Date(template.updatedAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`
                            inline-flex
                            px-2.5 py-1
                            rounded-full
                            text-[11px]
                            font-medium
                            ${
                              template.status === "Active" || template.status === "active"
                                ? "bg-emerald-50 text-emerald-600"
                                : template.status === "Inactive" || template.status === "inactive"
                                ? "bg-slate-100 text-slate-500"
                                : "bg-amber-50 text-amber-500"
                            }
                          `}
                        >
                          {template.status || "Draft"}
                        </span>
                      </td>

                      {/* Actions */}
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
                          <button
                            onClick={() => handleDelete(template.id, template.templateName || template.name)}
                            disabled={isDeleting}
                            title="Delete"
                            className="p-1.5 rounded hover:bg-gray-100 text-slate-400 hover:text-red-600 transition disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {/* No Results */}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
                      <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setCategory("All Categories");
                          setStatus("All Statuses");
                        }}
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

          {/* ================= STICKY PAGINATION (Like Ambulance UI) ================= */}
          <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Pagination
              currentPage={page}
              totalPages={Math.max(1, totalPages)}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={limit}
              itemLabel="templates"
            />
          </div>

        </div>

      </div>

    </div>
  );
};

export default EmailTemplates;