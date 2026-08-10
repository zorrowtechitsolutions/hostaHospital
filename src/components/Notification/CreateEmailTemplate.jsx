import React from "react";
import { useNavigate } from "react-router-dom";
import EmailTemplateForm from "./EmailTemplateForm";
import { useCreateTemplateMutation } from "../../../app/service/emailtemplate";

const CreateEmailTemplate = () => {
  const navigate = useNavigate();

  const [createTemplate, { isLoading }] = useCreateTemplateMutation();

  const handleSave = async (data) => {
    try {
      const payload = {
        templateName: data.templateName,
        subject: data.subject,
        message: data.message,
        category: data.category,
        status: "Active",
      };

      await createTemplate(payload).unwrap();

      alert("Email template created successfully.");

      navigate("/email-templates");
    } catch (error) {
      console.error("Create template error:", error);

      alert(
        error?.data?.message ||
          error?.message ||
          "Failed to create email template."
      );
    }
  };

  return (
    <EmailTemplateForm
      mode="create"
      onSave={handleSave}
      onCancel={() => navigate("/email-templates")}
      isLoading={isLoading}
    />
  );
};

export default CreateEmailTemplate;