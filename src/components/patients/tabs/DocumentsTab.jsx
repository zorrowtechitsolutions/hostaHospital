import React from "react";
import { Plus, File, Download, Trash2 } from "lucide-react";

const DocumentsTab = ({ patient, handleDownloadDocument, handleDeleteClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-sm font-medium">Total Documents <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">{patient.documentsList.length}</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Document Name</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">File Size</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {patient.documentsList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="p-3"><div className="flex items-center gap-2"><File size={16} className="text-blue-500" /><span className="font-medium text-gray-800">{item.documentName}</span></div></td>
                <td className="p-3 text-gray-600">{item.date}</td>
                <td className="p-3 text-gray-500">{item.fileSize}</td>
                <td className="p-3"><span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">{item.type}</span></td>
                <td className="p-3 text-right"><div className="flex gap-2 justify-end"><button onClick={() => handleDownloadDocument(item)} className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition"><Download size={16} /></button><button onClick={() => handleDeleteClick('document', item.id, index, item.documentName)} className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentsTab;