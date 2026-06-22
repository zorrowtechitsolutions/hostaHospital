import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Droplet } from "lucide-react";
import { Button } from "../../../ui";
import { useCreateBloodBankMutation } from "../../../../../app/service/bloodbank";
import { showSuccessToast, showErrorToast } from "../../../ui/Toast";

const BLOOD_GROUPS = [
  "A+","A-","B+","B-","AB+","AB-","O+","O-"
];

const AddBloodBank = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const hospitalId = location.state?.hospitalId;

  const [createBloodBank,{isLoading}] =
    useCreateBloodBankMutation();

  const [formData,setFormData] = useState({
    bloodGroup:"A+",
    count:""
  });

  const handleSubmit = async(e)=>{
    e.preventDefault();

    try{
      await createBloodBank({
        ...formData,
        hospitalId
      }).unwrap();

      showSuccessToast("Blood stock added");

      navigate(-1);

    }catch(error){
      showErrorToast(
        error?.data?.message || "Failed to add stock"
      );
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        onClick={()=>navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft size={16}/>
        Back
      </Button>

      <div className="bg-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          Add Blood Stock
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label>Blood Group</label>
            <select
              value={formData.bloodGroup}
              onChange={(e)=>
                setFormData({
                  ...formData,
                  bloodGroup:e.target.value
                })
              }
              className="w-full border rounded-lg p-3"
            >
              {BLOOD_GROUPS.map(group=>(
                <option key={group}>{group}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Units</label>
            <input
              type="number"
              min="0"
              value={formData.count}
              onChange={(e)=>
                setFormData({
                  ...formData,
                  count:e.target.value
                })
              }
              className="w-full border rounded-lg p-3"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            Add Blood Stock
          </Button>

        </form>
      </div>
    </div>
  );
};

export default AddBloodBank;