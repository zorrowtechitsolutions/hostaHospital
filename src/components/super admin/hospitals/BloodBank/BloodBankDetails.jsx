import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Droplet,
  Calendar
} from "lucide-react";
import { Button, Badge } from "../../../ui";
import { useGetBloodBankQuery }
from "../../../../../app/service/bloodbank";

const BloodBankDetails = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { data, isLoading } =
    useGetBloodBankQuery({ id });

  const blood = data?.data;

  if(isLoading){
    return <div>Loading...</div>;
  }

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

        <div className="flex items-center gap-4 mb-6">

          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <Droplet className="w-10 h-10 text-red-600"/>
          </div>

          <div>
            <h2 className="text-3xl font-bold">
              {blood?.bloodGroup}
            </h2>

            <Badge variant="success">
              {blood?.count} Units
            </Badge>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-6">

          <div>
            <p className="text-xs text-gray-500">
              Blood Group
            </p>

            <p className="font-semibold">
              {blood?.bloodGroup}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Available Units
            </p>

            <p className="font-semibold">
              {blood?.count}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Hospital ID
            </p>

            <p className="font-semibold">
              {blood?.hospitalId}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Last Updated
            </p>

            <p className="font-semibold">
              {blood?.updatedAt}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default BloodBankDetails;