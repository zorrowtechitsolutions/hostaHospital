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

  const { data } =
    useGetBloodBankQuery({ id });

  const blood = data?.data;

  const [updateBloodBank,{isLoading}] =
    useUpdateBloodBankMutation();

  const [formData,setFormData] = useState({
    bloodGroup:"",
    count:""
  });

  useEffect(()=>{
    if(blood){
      setFormData({
        bloodGroup:blood.bloodGroup,
        count:blood.count
      });
    }
  },[blood]);

  const handleSubmit = async(e)=>{
    e.preventDefault();

    try{
      await updateBloodBank({
        id,
        data:formData
      }).unwrap();

      showSuccessToast("Stock updated");

      navigate(-1);

    }catch(error){
      showErrorToast(
        error?.data?.message ||
        "Update failed"
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
          Edit Blood Stock
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>
            <label>Blood Group</label>
            <input
              value={formData.bloodGroup}
              onChange={(e)=>
                setFormData({
                  ...formData,
                  bloodGroup:e.target.value
                })
              }
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label>Units</label>
            <input
              type="number"
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
            Update Stock
          </Button>

        </form>

      </div>
    </div>
  );
};

export default EditBloodBank;