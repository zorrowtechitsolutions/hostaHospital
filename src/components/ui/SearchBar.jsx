import { Search, X } from "lucide-react";

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          h-10
          pl-4
          pr-12
          border
          border-gray-200
          rounded-md
          text-sm
          bg-white
          focus:outline-none
          focus:ring-2
          focus:ring-green-500
          focus:border-green-500
        "
      />

      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      )}

      <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-green-600 to-emerald-600 rounded p-1">
        <Search className="w-4 h-4 text-white" />
      </div>
    </div>
  );
};

