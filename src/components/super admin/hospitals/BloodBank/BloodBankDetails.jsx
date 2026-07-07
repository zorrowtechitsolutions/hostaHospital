import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Droplet, Loader2, Calendar, Building, Package } from "lucide-react";
import { Badge } from "../../../ui";
import { useGetBloodBankQuery } from "../../../../../app/service/bloodbank";

const BloodBankDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useGetBloodBankQuery({ id });
  const blood = data?.data;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  // Get stock status
  const getStockStatus = (count) => {
    if (count > 20) return { label: "High Stock", color: "bg-green-100 text-green-800" };
    if (count > 10) return { label: "Medium Stock", color: "bg-yellow-100 text-yellow-800" };
    if (count > 0) return { label: "Low Stock", color: "bg-orange-100 text-orange-800" };
    return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
  };

  // Get blood group color
  const getBloodGroupColor = (bloodGroup) => {
    const colors = {
      'A+': 'bg-red-100 text-red-700',
      'A-': 'bg-red-100 text-red-700',
      'B+': 'bg-blue-100 text-blue-700',
      'B-': 'bg-blue-100 text-blue-700',
      'O+': 'bg-green-100 text-green-700',
      'O-': 'bg-green-100 text-green-700',
      'AB+': 'bg-purple-100 text-purple-700',
      'AB-': 'bg-purple-100 text-purple-700'
    };
    return colors[bloodGroup] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-green-600" />
          <p className="text-sm text-gray-500">Loading blood stock details...</p>
        </div>
      </div>
    );
  }

  if (!blood) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <Droplet size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Blood stock not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const status = getStockStatus(blood.count);

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-sm text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header with Blood Group */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full ${getBloodGroupColor(blood.bloodGroup)} flex items-center justify-center flex-shrink-0`}>
                <Droplet size={28} className="text-current" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  {blood.bloodGroup}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="success" className="bg-green-100 text-green-800">
                    {blood.count} Units
                  </Badge>
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-5 space-y-4">
            {/* Blood Group */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Droplet size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">Blood Group</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {blood.bloodGroup}
              </span>
            </div>

            {/* Available Units */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">Available Units</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {blood.count}
              </span>
            </div>

            {/* Hospital ID */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Building size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">Hospital ID</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                #{blood.hospitalId || "N/A"}
              </span>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">Last Updated</span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {formatDate(blood.updatedAt)}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankDetails;