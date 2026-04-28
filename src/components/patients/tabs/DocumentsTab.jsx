import React from "react";
import { MoreVertical, File, Download, Trash2 } from "lucide-react";

const DocumentsTab = ({ patient, handleDownloadDocument, handleDeleteClick }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Documents
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {patient.documentsList.length}
          </span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Document Name</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">File Size</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patient.documentsList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <File size={16} className="text-blue-500" />
                    <span className="font-medium text-gray-800">{item.documentName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{item.date}</td>
                <td className="px-6 py-4 text-gray-500">{item.fileSize}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">{item.type}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleDownloadDocument(item)}
                      className="p-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Download size={16} className="text-gray-500 hover:text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick('document', item.id, index, item.documentName)}
                      className="p-2 rounded hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} className="text-gray-500 hover:text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentsTab;