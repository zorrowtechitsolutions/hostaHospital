import React from "react";
import { useNavigate } from "react-router-dom";
import LeaveTemplateForm from "./LeaveTemplateForm";
import { showSuccessToast, showErrorToast } from "../ui/Toast";
import { useCreateLeaveTemplateMutation } from "../../../app/service/leaverequesttemplate";
import { getAuthUser } from "../../utils/auth";

const CreateLeaveTemplate = () => {
  const navigate = useNavigate();

  const [createLeaveTemplate, { isLoading }] =
    useCreateLeaveTemplateMutation();

  const handleSave = async (data) => {
    try {
      const auth = getAuthUser();

      if (!auth) {
        showErrorToast("User information not found.", 3000);
        return;
      }

      const payload = {
        hospitalId: Number(auth.hospitalId),

        templateName: data.templateName,
        reasonCategory: data.category,
        templateText: data.message,

        placeholders: data.placeholders || [],
        icon: data.icon || "file-text",

        // Employee-created template
        isPredefined: false,
        isRecommended: false,
      };

      console.log("CREATE LEAVE TEMPLATE PAYLOAD:", payload);

      await createLeaveTemplate(payload).unwrap();

      showSuccessToast(
        "Leave request template created successfully.",
        3000
      );

      navigate("/leave-templates");
    } catch (error) {
      console.error("Create leave template error:", error);

      showErrorToast(
        error?.data?.message || "Failed to create leave template.",
        3000
      );
    }
  };

  return (
    <LeaveTemplateForm
      mode="create"
      onSave={handleSave}
      onCancel={() => navigate("/leave-templates")}
      isLoading={isLoading}
    />
  );
};

export default CreateLeaveTemplate;