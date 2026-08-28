import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Eye,
  Paperclip,
  List,
  ListOrdered,
  AlignLeft,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { showErrorToast } from "../ui/Toast";

const AVAILABLE_VARIABLES = [
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

// ================= SKELETON LOADING COMPONENT =================
const FormSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          {/* Header Skeleton */}
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-12 gap-6 p-6">
            <div className="col-span-12 lg:col-span-9">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-5"></div>
              
              {/* Form Fields Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Subject Skeleton */}
              <div className="mt-5">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse"></div>
              </div>

              {/* Message Skeleton */}
              <div className="mt-5">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="h-11 px-3 flex items-center gap-4 border-b border-slate-200 bg-slate-50">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-px h-5 bg-slate-200"></div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                  <div className="h-64 w-full bg-gray-100 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Skeleton */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-indigo-50 rounded-xl p-5">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-5"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= MAIN FORM COMPONENT =================
const EmailTemplateForm = ({
  mode = "create",
  initialData = {},
  onCancel,
  onSave,
  isLoading = false,
  isFetching = false,
}) => {
  const [templateName, setTemplateName] = useState(
    initialData.templateName || ""
  );

  const [category, setCategory] = useState(
    initialData.category || ""
  );

  const [subject, setSubject] = useState(
    initialData.subject || ""
  );

  const [message, setMessage] = useState(
    initialData.message || ""
  );

  // Status state - important for Edit mode to preserve existing status
  const [status, setStatus] = useState(
    initialData.status || "Active"
  );

  // Editor reference
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);

  // File input refs
  const fileInputRef = useRef(null);

  // Initialize editor content only once when initialData.message changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialData.message || "";
      setMessage(initialData.message || "");
    }
  }, [initialData.message]);

  // Show skeleton while fetching
  if (isFetching) {
    return <FormSkeleton />;
  }

  // Save and restore selection functions
  const saveSelection = () => {
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (selection && savedSelectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }
  };

  // Format text using execCommand
  const formatText = (command, value = null) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }
  };

  // Handle editor input changes
  const handleEditorInput = () => {
    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }
  };

  // Insert variable at cursor position
  const insertVariable = (variable) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertText", false, `{{${variable}}}`);
    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }
  };

  // Handle file attachment selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    saveSelection();

    editorRef.current?.focus();
    restoreSelection();

    const fileName = file.name;

    document.execCommand(
      "insertHTML",
      false,
      `<span
        data-file-name="${fileName}"
        data-file-type="${file.type}"
        class="email-attachment"
      >
        📎 ${fileName}
      </span>&nbsp;`
    );

    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }

    e.target.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!templateName.trim()) {
      showErrorToast("Please enter template name.", 3000);
      return;
    }

    if (!category.trim()) {
      showErrorToast("Please enter a category.", 3000);
      return;
    }

    if (!subject.trim()) {
      showErrorToast("Please enter subject.", 3000);
      return;
    }

    // Get the HTML content from the editor
    const messageContent = editorRef.current?.innerHTML || message;

    if (!messageContent.trim() || messageContent === "<br>") {
      showErrorToast("Please enter message.", 3000);
      return;
    }

    // Include status in the data object
    const data = {
      templateName,
      category,
      subject,
      message: messageContent,
      status,
    };

    if (onSave) {
      onSave(data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="max-w-7xl mx-auto"
      >
        {/* ================= MAIN CARD ================= */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200">
            <h1 className="text-lg font-semibold text-slate-800">
              {mode === "edit"
                ? "Edit Email Template"
                : "Create Email Template"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === "edit"
                ? "Update your email template information."
                : "Create a reusable email template for quick communication."}
            </p>
          </div>

          {/* ================= CONTENT ================= */}
          <div className="grid grid-cols-12 gap-6 p-6">
            {/* LEFT */}
            <div className="col-span-12 lg:col-span-9">
              <h2 className="text-sm font-semibold text-slate-800 mb-5">
                Template Information
              </h2>

              {/* Name + Category + Status - 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Template Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    className="
                      w-full h-11 px-3
                      border border-slate-200
                      rounded-lg
                      text-sm
                      outline-none
                      focus:border-indigo-500
                      focus:ring-2
                      focus:ring-indigo-100
                    "
                  />
                </div>

                {/* Category - Simple text input without suggestions */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Enter category (e.g., General, Alert, Training)"
                    className="
                      w-full h-11 px-3
                      border border-slate-200
                      rounded-lg
                      text-sm
                      outline-none
                      focus:border-indigo-500
                      focus:ring-2
                      focus:ring-indigo-100
                    "
                  />
                </div>

                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="
                      w-full h-11 px-3
                      border border-slate-200
                      rounded-lg
                      bg-white
                      text-sm
                      text-slate-700
                      outline-none
                      focus:border-indigo-500
                      focus:ring-2
                      focus:ring-indigo-100
                    "
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div className="mt-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="
                    w-full h-11 px-3
                    border border-slate-200
                    rounded-lg
                    text-sm
                    outline-none
                    focus:border-indigo-500
                    focus:ring-2
                    focus:ring-indigo-100
                  "
                />
              </div>

              {/* Message */}
              <div className="mt-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div
                  className="
                    border border-slate-200
                    rounded-lg
                    overflow-hidden
                    focus-within:border-indigo-500
                    focus-within:ring-2
                    focus-within:ring-indigo-100
                  "
                >
                  {/* Toolbar */}
                  <div className="
                    h-11
                    px-3
                    flex items-center
                    gap-4
                    border-b border-slate-200
                    bg-slate-50
                  ">
                    <span className="text-xs font-medium text-slate-600">
                      Paragraph
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                    <div className="w-px h-5 bg-slate-200" />
                    
                    {/* Bold */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("bold");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Bold"
                    >
                      <Bold size={16} />
                    </button>
                    
                    {/* Italic */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("italic");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Italic"
                    >
                      <Italic size={16} />
                    </button>
                    
                    {/* Underline */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("underline");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Underline"
                    >
                      <Underline size={16} />
                    </button>
                    
                    <div className="w-px h-5 bg-slate-200" />
                    
                    {/* Bullet List */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("insertUnorderedList");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Bullet list"
                    >
                      <List size={16} />
                    </button>
                    
                    {/* Numbered List */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("insertOrderedList");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Numbered list"
                    >
                      <ListOrdered size={16} />
                    </button>
                    
                    {/* Align Left */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("justifyLeft");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Align left"
                    >
                      <AlignLeft size={16} />
                    </button>
                    
                    {/* Attachment - File picker */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        fileInputRef.current?.click();
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Attach file"
                    >
                      <Paperclip size={16} />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Editor - contentEditable div with proper initialization */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    className="
                      w-full
                      min-h-[280px]
                      p-4
                      text-sm
                      text-slate-700
                      outline-none
                      overflow-y-auto
                      focus:outline-none

                      /* List styles */
                      [&_ul]:list-disc
                      [&_ul]:pl-6
                      [&_ul]:my-2

                      [&_ol]:list-decimal
                      [&_ol]:pl-6
                      [&_ol]:my-2

                      [&_li]:my-1

                      /* Link styles */
                      [&_a]:text-indigo-600
                      [&_a]:underline

                      /* Image styles */
                      [&_img]:max-w-full
                      [&_img]:h-auto
                      [&_img]:my-2

                      /* Attachment styles */
                      [&_.email-attachment]:inline-block
                      [&_.email-attachment]:bg-slate-100
                      [&_.email-attachment]:text-slate-700
                      [&_.email-attachment]:px-2
                      [&_.email-attachment]:py-1
                      [&_.email-attachment]:rounded
                      [&_.email-attachment]:text-xs
                      [&_.email-attachment]:font-medium
                      [&_.email-attachment]:border
                      [&_.email-attachment]:border-slate-200
                    "
                    style={{ maxHeight: "500px" }}
                  />
                </div>
              </div>
            </div>

            {/* ================= RIGHT VARIABLES ================= */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-indigo-50 rounded-xl p-5 sticky top-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-5">
                  Available Variables
                </h3>
                <div className="space-y-4">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <button
                      key={variable.key}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        insertVariable(variable.key);
                      }}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        text-left
                        group
                      "
                    >
                      <span className="
                        min-w-[110px]
                        text-[11px]
                        font-semibold
                        text-slate-700
                      ">
                        ({variable.key})
                      </span>
                      <span className="
                        text-xs
                        text-slate-500
                        group-hover:text-indigo-600
                      ">
                        {variable.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Hint */}
                <div className="
                  mt-6
                  bg-white/70
                  rounded-lg
                  p-3
                  text-xs
                  text-slate-500
                  flex
                  gap-2
                ">
                  <span className="text-indigo-500">💡</span>
                  <span>
                    Click on a variable to insert it at the cursor position.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="
                px-5 py-2.5
                border border-slate-200
                rounded-lg
                text-sm
                font-medium
                text-slate-600
                hover:bg-slate-50
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="
                px-6 py-2.5
                bg-indigo-600
                hover:bg-indigo-700
                disabled:bg-indigo-300
                disabled:cursor-not-allowed
                text-white
                rounded-lg
                text-sm
                font-medium
                shadow-sm
              "
            >
              {isLoading
                ? mode === "edit"
                  ? "Updating..."
                  : "Saving..."
                : mode === "edit"
                  ? "Update Template"
                  : "Save Template"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmailTemplateForm;