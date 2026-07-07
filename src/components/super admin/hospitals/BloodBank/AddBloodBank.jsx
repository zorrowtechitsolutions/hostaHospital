import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Droplet, Plus } from "lucide-react";
import { Button } from "../../../ui";
import { useCreateBloodBankMutation } from "../../../../../app/service/bloodbank";
import { showSuccessToast, showErrorToast } from "../../../ui/Toast";

const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

const AddBloodBank = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hospitalId = location.state?.hospitalId;

  const [createBloodBank, { isLoading }] = useCreateBloodBankMutation();
  const [formData, setFormData] = useState({
    bloodGroup: "A+",
    count: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBloodBank({ ...formData, hospitalId }).unwrap();
      showSuccessToast("Blood stock added successfully!");
      navigate(-1);
    } catch (error) {
      showErrorToast(error?.data?.message || "Failed to add blood stock");
    }
  };

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
                Add Blood Stock
              </h2>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) =>
                  setFormData({ ...formData, bloodGroup: e.target.value })
                }
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
                min="0"
                placeholder="Enter number of units"
                value={formData.count}
                onChange={(e) =>
                  setFormData({ ...formData, count: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white transition-colors"
                required
              />
            </div>

            {/* Preview */}
            {formData.count && parseInt(formData.count) > 0 && (
              <div className="px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm text-green-700">
                  Adding <span className="font-semibold">{formData.count}</span> units of{" "}
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
              isLoading={isLoading}
              disabled={isLoading || !formData.count}
              leftIcon={<Plus size={18} />}
            >
              Add Blood Stock
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBloodBank;