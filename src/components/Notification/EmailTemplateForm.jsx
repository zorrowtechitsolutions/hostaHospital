import React, { useState } from "react";
import {
  ChevronDown,
  Eye,
  Link,
  Image,
  List,
  ListOrdered,
  AlignLeft,
  Bold,
  Italic,
  Underline,
} from "lucide-react";

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

// ✅ Categories are now suggestions, not a fixed dropdown
const SUGGESTED_CATEGORIES = [
  "General",
  "Alert",
  "Training",
  "Information",
];

const EmailTemplateForm = ({
  mode = "create",
  initialData = {},
  onCancel,
  onSave,
  isLoading = false,
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

  // ✅ State for showing category suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // ✅ Handle category input change
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategory(value);
    
    // Filter suggestions based on input
    if (value.trim()) {
      const filtered = SUGGESTED_CATEGORIES.filter(cat =>
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // ✅ Handle category suggestion click
  const handleCategorySelect = (selected) => {
    setCategory(selected);
    setShowSuggestions(false);
  };

  // ✅ Handle blur to hide suggestions
  const handleCategoryBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const insertVariable = (variable) => {
    setMessage((prev) => `${prev} {{${variable}}}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!templateName.trim()) {
      alert("Please enter template name.");
      return;
    }

    if (!category.trim()) {
      alert("Please enter a category.");
      return;
    }

    if (!subject.trim()) {
      alert("Please enter subject.");
      return;
    }

    if (!message.trim()) {
      alert("Please enter message.");
      return;
    }

    const data = {
      templateName,
      category,
      subject,
      message,
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

              {/* Name + Category */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Template Name */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Template Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) =>
                      setTemplateName(e.target.value)
                    }
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

                {/* ✅ Category - Now a text input with suggestions */}

                <div className="relative">

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={category}
                      onChange={handleCategoryChange}
                      onFocus={() => {
                        if (category.trim()) {
                          const filtered = SUGGESTED_CATEGORIES.filter(cat =>
                            cat.toLowerCase().includes(category.toLowerCase())
                          );
                          setFilteredCategories(filtered);
                          setShowSuggestions(filtered.length > 0);
                        }
                      }}
                      onBlur={handleCategoryBlur}
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

                    {/* Optional: Clear button */}
                    {category && (
                      <button
                        type="button"
                        onClick={() => setCategory('')}
                        className="
                          absolute right-3 top-1/2 -translate-y-1/2
                          text-slate-400 hover:text-slate-600
                          text-sm
                        "
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* ✅ Suggestions Dropdown */}
                  {showSuggestions && filteredCategories.length > 0 && (
                    <div className="
                      absolute z-10 mt-1 w-full
                      bg-white border border-slate-200
                      rounded-lg shadow-lg
                      max-h-48 overflow-y-auto
                    ">
                      {filteredCategories.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleCategorySelect(suggestion)}
                          className="
                            w-full text-left px-4 py-2.5
                            text-sm text-slate-700
                            hover:bg-indigo-50
                            transition-colors
                            border-b border-slate-50 last:border-0
                            flex items-center gap-2
                          "
                        >
                          <span className="text-indigo-400">#</span>
                          {suggestion}
                          <span className="ml-auto text-xs text-slate-400">
                            suggested
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Helper text */}
                  <p className="text-xs text-slate-400 mt-1.5">
                    Type a category name or choose from suggestions
                  </p>

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
                  onChange={(e) =>
                    setSubject(e.target.value)
                  }
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

                    <ChevronDown
                      size={14}
                      className="text-slate-400"
                    />

                    <div className="w-px h-5 bg-slate-200" />

                    <button
                      type="button"
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      <Bold size={16} />
                    </button>

                    <button
                      type="button"
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      <Italic size={16} />
                    </button>

                    <button
                      type="button"
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      <Underline size={16} />
                    </button>

                    <div className="w-px h-5 bg-slate-200" />

                    <button
                      type="button"
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      <List size={16} />
                    </button>

                    <button
                      type="button"
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      <ListOrdered size={16} />
                    </button>

                    <button
                      type="button"
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      <AlignLeft size={16} />
                    </button>

                    <button
                      type="button"
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      <Link size={16} />
                    </button>

                    <button
                      type="button"
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      <Image size={16} />
                    </button>

                  </div>

                  {/* Editor */}

                  <textarea
                    value={message}
                    onChange={(e) =>
                      setMessage(e.target.value)
                    }
                    rows={10}
                    placeholder="Write your email content here..."
                    className="
                      w-full
                      p-4
                      text-sm
                      text-slate-700
                      outline-none
                      resize-none
                    "
                  />

                </div>

              </div>

            </div>

            {/* ================= RIGHT VARIABLES ================= */}

            <div className="col-span-12 lg:col-span-3">

              <div className="
                bg-indigo-50
                rounded-xl
                p-5
                sticky
                top-6
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

                  {AVAILABLE_VARIABLES.map((variable) => (

                    <button
                      key={variable.key}
                      type="button"
                      onClick={() =>
                        insertVariable(variable.key)
                      }
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

                  <span className="text-indigo-500">
                    💡
                  </span>

                  <span>
                    Click on a variable to insert it
                    into the message.
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* ================= FOOTER ================= */}

          <div className="
            px-6 py-4
            border-t border-slate-200
            flex justify-end
            gap-3
          ">

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