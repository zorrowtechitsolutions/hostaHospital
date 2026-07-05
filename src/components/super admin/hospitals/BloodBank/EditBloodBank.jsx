import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../ui";
import {
  useGetBloodBankQuery,
  useUpdateBloodBankMutation
} from "../../../../../app/service/bloodbank";
import {
  showSuccessToast,
  showErrorToast
} from "../../../ui/Toast";

const EditBloodBank = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data } = useGetBloodBankQuery({ id });
  const blood = data?.data;

  const [updateBloodBank, { isLoading }] = useUpdateBloodBankMutation();

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

      showSuccessToast("Stock updated successfully");
      navigate(-1);
    } catch (error) {
      showErrorToast(
        error?.data?.message || "Update failed"
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft size={16} />
        Back
      </Button>

      <div className="bg-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          Edit Blood Stock
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Group
            </label>
            <input
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
              placeholder="Enter blood group"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Units
            </label>
            <input
              type="number"
              name="count"
              value={formData.count}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
              placeholder="Enter number of units"
              min="0"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? "Updating..." : "Update Stock"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditBloodBank;