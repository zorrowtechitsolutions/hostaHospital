import React from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Users,
  CalendarDays,
  AlertTriangle,
  GraduationCap,
  Wrench,
  FileText,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetTemplateByIdQuery,
  useDeleteTemplateMutation,
} from "../../../app/service/emailtemplate";
import { Button } from "../ui/button";

const variables = [
  {
    key: "DATE",
    label: "Meeting date",
  },
  {
    key: "TIME",
    label: "Meeting time",
  },
  {
    key: "VENUE",
    label: "Meeting venue",
  },
  {
    key: "HOSPITAL_NAME",
    label: "Hospital name",
  },
  {
    key: "SENDER_NAME",
    label: "Sender name",
  },
];

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

const ViewEmailTemplate = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ============================
  // API QUERIES
  // ============================

  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetTemplateByIdQuery(id, {
    skip: !id,
  });

  const [
    deleteTemplate,
    { isLoading: isDeleting },
  ] = useDeleteTemplateMutation();

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
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/email-templates")}
            >
              Back to Templates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // API DATA
  // ============================

  const template = data?.data;

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">
              Template not found.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/email-templates")}
              className="mt-4"
            >
              Back to Templates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = getIconForCategory(template.category);

  // ============================
  // HANDLERS
  // ============================

  const handleEdit = () => {
    navigate(`/email-templates/edit/${id}`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this template?"
    );

    if (!confirmed) return;

    try {
      await deleteTemplate(id).unwrap();
      alert("Template deleted successfully.");
      navigate("/email-templates");
    } catch (error) {
      console.error("Delete template error:", error);
      alert(
        error?.data?.message ||
          "Failed to delete template."
      );
    }
  };

  // ============================
  // RENDER
  // ============================

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      <div className="max-w-7xl mx-auto">

        {/* ================= HEADER ================= */}

        <div className="
          bg-white
          border border-slate-200
          rounded-xl
          p-5
          mb-5
        ">

          <div className="
            flex
            items-center
            justify-between
            gap-4
          ">

            <div className="flex items-center gap-4">

              <div className="
                w-12 h-12
                rounded-xl
                bg-indigo-50
                flex
                items-center
                justify-center
              ">
                <Icon
                  size={23}
                  className="text-indigo-600"
                />
              </div>

              <div>

                <div className="flex items-center gap-3">

                  <h1 className="
                    text-lg
                    font-semibold
                    text-slate-800
                  ">
                    {template.templateName || template.name}
                  </h1>

                  <span className={`
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
                  `}>
                    {template.status || "Draft"}
                  </span>

                </div>

                <span className="
                  inline-flex
                  mt-1
                  px-2.5 py-1
                  rounded-full
                  bg-indigo-50
                  text-indigo-600
                  text-[11px]
                  font-medium
                ">
                  {template.category || "General"}
                </span>

              </div>

            </div>

            {/* Actions */}

            <div className="flex items-center gap-3">

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
                onClick={() => navigate("/email-templates")}
              >
                Back to Templates
              </Button>

            </div>

          </div>

        </div>

        {/* ================= INFORMATION ================= */}

        <div className="
          bg-white
          border border-slate-200
          rounded-xl
          p-6
        ">

          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-y-5
            gap-x-12
            border-b
            border-slate-200
            pb-6
          ">

            <div className="flex">

              <span className="
                w-28
                text-xs
                font-semibold
                text-slate-500
              ">
                Subject
              </span>

              <span className="
                text-sm
                text-slate-700
              ">
                {template.subject}
              </span>

            </div>

            <div className="flex">

              <span className="
                w-32
                text-xs
                font-semibold
                text-slate-500
              ">
                Last Updated By
              </span>

              <span className="
                text-sm
                text-slate-700
              ">
                {template.createdBy || "System"}
              </span>

            </div>

            <div className="flex">

              <span className="
                w-28
                text-xs
                font-semibold
                text-slate-500
              ">
                Created By
              </span>

              <span className="
                text-sm
                text-slate-700
              ">
                {template.createdBy || "System"}
              </span>

            </div>

            <div className="flex">

              <span className="
                w-32
                text-xs
                font-semibold
                text-slate-500
              ">
                Last Updated At
              </span>

              <span className="
                text-sm
                text-slate-700
              ">
                {template.updatedAt
                  ? new Date(template.updatedAt).toLocaleString()
                  : "N/A"}
              </span>

            </div>

            <div className="flex">

              <span className="
                w-28
                text-xs
                font-semibold
                text-slate-500
              ">
                Created At
              </span>

              <span className="
                text-sm
                text-slate-700
              ">
                {template.createdAt
                  ? new Date(template.createdAt).toLocaleString()
                  : "N/A"}
              </span>

            </div>

          </div>

          {/* ================= MESSAGE ================= */}

          <div className="
            grid
            grid-cols-12
            gap-6
            mt-6
          ">

            {/* Message */}

            <div className="col-span-12 lg:col-span-9">

              <h2 className="
                text-sm
                font-semibold
                text-slate-700
                mb-3
              ">
                Message
              </h2>

              <div
                className="
                  min-h-[360px]
                  border
                  border-slate-200
                  rounded-lg
                  p-5
                  text-sm
                  text-slate-700
                  leading-7
                  bg-white
                "
                dangerouslySetInnerHTML={{
                  __html: template.message || template.body || "",
                }}
              />

            </div>

            {/* Variables */}

            <div className="col-span-12 lg:col-span-3">

              <div className="
                bg-indigo-50
                rounded-xl
                p-5
              ">

                <h3 className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-5
                ">
                  Available Variables
                </h3>

                <div className="space-y-4">

                  {variables.map((variable) => (

                    <div
                      key={variable.key}
                      className="
                        flex
                        items-start
                        gap-2
                      "
                    >

                      <span className="
                        min-w-[100px]
                        text-[10px]
                        font-semibold
                        text-slate-700
                      ">
                        ({variable.key})
                      </span>

                      <span className="
                        text-xs
                        text-slate-500
                      ">
                        {variable.label}
                      </span>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>

          {/* ================= DELETE ================= */}

          <div className="
            border-t
            border-slate-200
            mt-6
            pt-5
          ">

            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={16} />}
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete Template
            </Button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ViewEmailTemplate;