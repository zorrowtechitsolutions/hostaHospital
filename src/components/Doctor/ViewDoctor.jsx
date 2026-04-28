import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ViewDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    const savedDoctors = JSON.parse(localStorage.getItem("doctors")) || [];
    const foundDoctor = savedDoctors.find(d => d.id === parseInt(id));
    setDoctor(foundDoctor);
  }, [id]);

  if (!doctor) return <p className="p-6">Loading...</p>;

return (
  <div className="p-6 bg-[#F8F9FA] min-h-screen">

    {/* HEADER */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-xl font-semibold text-gray-800">
        Doctor Details
      </h1>

      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-600 hover:underline"
      >
        ← Back to Doctors
      </button>
    </div>

    {/* GRID */}
    <div className="grid grid-cols-12 gap-6">

      {/* LEFT PANEL */}
      <div className="col-span-4 bg-white rounded-xl  p-5">

        {/* PROFILE */}
        <div className="flex gap-4 items-center mb-4">
          <img
            src={doctor.photo}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div>
            <p className="text-xs text-blue-600 font-medium">
              #DR{String(doctor.id).padStart(5, "0")}
            </p>
            <h2 className="font-semibold text-gray-800">
              {doctor.name}
            </h2>
            <p className="text-sm text-gray-500">
              {doctor.specialty}
            </p>
          </div>
        </div>

        <hr className="my-4 border-gray-100" />

        {/* BASIC INFO */}
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Basic Information
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          <p><b>Specialist:</b> {doctor.specialty}</p>
          <p><b>DOB:</b> {doctor.dob || "-"}</p>
          <p><b>Gender:</b> {doctor.gender || "-"}</p>
          <p><b>Experience:</b> {doctor.experience}</p>
          <p><b>Phone:</b> {doctor.phone}</p>
          <p><b>Email:</b> {doctor.email}</p>
          <p><b>Registration:</b> {doctor.registrationNumber || "-"}</p>
          <p><b>Appointments:</b> {doctor.appointments}</p>
        </div>

        <hr className="my-4 border-gray-100" />

        {/* ADDRESS */}
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Address Information
        </h3>

        <p className="text-sm text-gray-600">
          {doctor.address}, {doctor.city}, {doctor.state}, {doctor.country}
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="col-span-8 space-y-4">

        {/* ABOUT */}
        <div className="bg-white rounded-xl  p-5">
          <h3 className="font-semibold text-gray-800 mb-2">About</h3>
          <p className="text-sm text-gray-600">
            {doctor.about || "No description available"}
          </p>
        </div>

        {/* EDUCATION */}
        <div className="bg-white rounded-xl  p-5">
          <h3 className="font-semibold text-gray-800">Education</h3>
        </div>

        {/* EXPERIENCE */}
        <div className="bg-white rounded-xl  p-5">
          <h3 className="font-semibold text-gray-800">Experience</h3>
        </div>

        {/* MEMBERSHIP */}
        <div className="bg-white rounded-xl  p-5">
          <h3 className="font-semibold text-gray-800">Membership</h3>
        </div>

        {/* AWARDS */}
        <div className="bg-white rounded-xl  p-5">
          <h3 className="font-semibold text-gray-800">Awards</h3>
        </div>

      </div>

    </div>
  </div>
);
};

export default ViewDoctor;