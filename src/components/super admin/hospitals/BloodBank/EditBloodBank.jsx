import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Droplet, Loader2 } from "lucide-react";
import { Button } from "../../../ui";
import { useGetBloodBankQuery, useUpdateBloodBankMutation } from "../../../../../app/service/bloodbank";
import { showSuccessToast, showErrorToast } from "../../../ui/Toast";

const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

const EditBloodBank = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading: isFetching } = useGetBloodBankQuery({ id });
  const blood = data?.data;

  const [updateBloodBank, { isLoading: isUpdating }] = useUpdateBloodBankMutation();

  const [formData, setFormData] = useState({
    bloodGroup: "",
    count: ""
  });

  useEffect(() => {
    if (blood) {
      setFormData({
        bloodGroup: blood.bloodGroup,
        count: blood.count
      });
    }
  }, [blood]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateBloodBank({
        id,
        data: formData
      }).unwrap();

      showSuccessToast("Blood stock updated successfully!");
      navigate(-1);
    } catch (error) {
      showErrorToast(error?.data?.message || "Failed to update blood stock");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show loading state while fetching data
  if (isFetching) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-green-600" />
          <p className="text-sm text-gray-500">Loading blood stock details...</p>
        </div>
      </div>
    );
  }

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
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Droplet size={18} className="text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Blood Stock
              </h2>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Blood Group - Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Blood Group
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white transition-colors"
              >
                {BLOOD_GROUPS.map(group => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Units
              </label>
              <input
                type="number"
                name="count"
                value={formData.count}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white transition-colors"
                placeholder="Enter number of units"
                min="0"
                required
              />
            </div>

            {/* Preview */}
            {formData.count && parseInt(formData.count) > 0 && (
              <div className="px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm text-green-700">
                  Updating to <span className="font-semibold">{formData.count}</span> units of{" "}
                  <span className="font-semibold">{formData.bloodGroup}</span>
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isUpdating}
              disabled={isUpdating || !formData.count}
            >
              Update Stock
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBloodBank;