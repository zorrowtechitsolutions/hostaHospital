import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
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
  { key: "EMPLOYEE_NAME", label: "Employee name" },
  { key: "LEAVE_TYPE", label: "Leave type" },
  { key: "START_DATE", label: "Start date" },
  { key: "END_DATE", label: "End date" },
  { key: "TOTAL_DAYS", label: "Total days" },
  { key: "REASON", label: "Reason" },
  { key: "MANAGER_NAME", label: "Manager name" },
];

const LeaveTemplateForm = ({
  mode = "create",
  initialData = {},
  onCancel,
  onSave,
  isLoading = false,
}) => {
  const [templateName, setTemplateName] = useState(initialData.templateName || "");
  const [category, setCategory] = useState(initialData.category || "");
  const [message, setMessage] = useState(initialData.message || "");
  const [status, setStatus] = useState(initialData.status || "Active");

  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialData.message || "";
      setMessage(initialData.message || "");
    }
  }, [initialData.message]);

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

  const formatText = (command, value = null) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    if (editorRef.current) setMessage(editorRef.current.innerHTML);
  };

  const handleEditorInput = () => {
    if (editorRef.current) setMessage(editorRef.current.innerHTML);
  };

  const insertVariable = (variable) => {
    const variableText = `{{${variable}}}`;
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertText", false, variableText);
    if (editorRef.current) setMessage(editorRef.current.innerHTML);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    saveSelection();
    editorRef.current?.focus();
    restoreSelection();

    document.execCommand(
      "insertHTML",
      false,
      `<span data-file-name="${file.name}" data-file-type="${file.type}" class="email-attachment">📎 ${file.name}</span>&nbsp;`
    );

    if (editorRef.current) setMessage(editorRef.current.innerHTML);
    e.target.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!templateName.trim())
      return showErrorToast("Please enter template name.", 3000);
    if (!category.trim())
      return showErrorToast("Please enter a category.", 3000);

    const messageContent = editorRef.current?.innerHTML || message;
    if (!messageContent.trim() || messageContent === "<br>") {
      return showErrorToast("Please enter message.", 3000);
    }

    onSave?.({
      templateName,
      category,
      message: messageContent,
      status,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200">
            <h1 className="text-lg font-semibold text-slate-800">
              {mode === "edit"
                ? "Edit Leave Request Template"
                : "Create Leave Request Template"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === "edit"
                ? "Update your leave request template information."
                : "Create a reusable leave request template for quick communication."}
            </p>
          </div>

          <div className="grid grid-cols-12 gap-6 p-6">
            <div className="col-span-12 lg:col-span-9">
              <h2 className="text-sm font-semibold text-slate-800 mb-5">
                Template Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Template Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Annual Leave Request"
                    className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Sick Leave, Casual Leave"
                    className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                  <div className="h-11 px-3 flex items-center gap-4 border-b border-slate-200 bg-slate-50">
                    <span className="text-xs font-medium text-slate-600">
                      Paragraph
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                    <div className="w-px h-5 bg-slate-200" />

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

                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    className="w-full min-h-[280px] p-4 text-sm text-slate-700 outline-none overflow-y-auto
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                      [&_li]:my-1
                      [&_a]:text-indigo-600 [&_a]:underline
                      [&_img]:max-w-full [&_img]:h-auto [&_img]:my-2
                      [&_.email-attachment]:inline-block [&_.email-attachment]:bg-slate-100 [&_.email-attachment]:text-slate-700 [&_.email-attachment]:px-2 [&_.email-attachment]:py-1 [&_.email-attachment]:rounded [&_.email-attachment]:text-xs [&_.email-attachment]:font-medium [&_.email-attachment]:border [&_.email-attachment]:border-slate-200"
                    style={{ maxHeight: "500px" }}
                  />
                </div>
              </div>
            </div>

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
                      className="w-full flex items-center gap-3 text-left group"
                    >
                      <span className="min-w-[130px] text-[11px] font-semibold text-slate-700">
                        ({variable.key})
                      </span>
                      <span className="text-xs text-slate-500 group-hover:text-indigo-600">
                        {variable.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 bg-white/70 rounded-lg p-3 text-xs text-slate-500 flex gap-2">
                  <span className="text-indigo-500">💡</span>
                  <span>
                    Click on a variable to insert it at the cursor position.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-medium shadow-sm"
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

export default LeaveTemplateForm;