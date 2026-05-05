// src/components/Doctor/ViewDoctor.jsx - Refactored
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, Card, Badge, Loader } from "../ui";

const ViewDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedDoctors = JSON.parse(localStorage.getItem("doctors")) || [];
    const foundDoctor = savedDoctors.find(d => d.id === parseInt(id));
    setDoctor(foundDoctor);
    setLoading(false);
  }, [id]);

  if (loading) return <Loader centered />;
  if (!doctor) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Doctor not found</p>
      <Button variant="primary" onClick={() => navigate('/doctors')} className="mt-4">Back to Doctors</Button>
    </div>
  );

  return (
    <div className="p-6 bg-[#F8F9FA] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Doctor Details</h1>
        <Button variant="ghost" onClick={() => navigate(-1)}>← Back to Doctors</Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT PANEL */}
        <div className="col-span-4">
          <Card className="p-5">
            <div className="flex gap-4 items-center mb-4">
              <img src={doctor.photo} className="w-16 h-16 rounded-lg object-cover" alt={doctor.name} />
              <div>
                <Badge variant="info" className="text-xs">#DR{String(doctor.id).padStart(5, "0")}</Badge>
                <h2 className="font-semibold text-gray-800 mt-1">{doctor.name}</h2>
                <p className="text-sm text-gray-500">{doctor.specialty}</p>
              </div>
            </div>
            <hr className="my-4 border-gray-100" />
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Specialist:</strong> {doctor.specialty}</p>
              <p><strong>DOB:</strong> {doctor.dob || "-"}</p>
              <p><strong>Gender:</strong> {doctor.gender || "-"}</p>
              <p><strong>Experience:</strong> {doctor.experience}</p>
              <p><strong>Phone:</strong> {doctor.phone}</p>
              <p><strong>Email:</strong> {doctor.email}</p>
              <p><strong>Registration:</strong> {doctor.registrationNumber || "-"}</p>
              <p><strong>Appointments:</strong> {doctor.appointments}</p>
            </div>
            <hr className="my-4 border-gray-100" />
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Address Information</h3>
            <p className="text-sm text-gray-600">{doctor.address}, {doctor.city}, {doctor.state}, {doctor.country}</p>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-8 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-2">About</h3>
            <p className="text-sm text-gray-600">{doctor.about || "No description available"}</p>
          </Card>
          <Card className="p-5"><h3 className="font-semibold text-gray-800">Education</h3></Card>
          <Card className="p-5"><h3 className="font-semibold text-gray-800">Experience</h3></Card>
          <Card className="p-5"><h3 className="font-semibold text-gray-800">Membership</h3></Card>
          <Card className="p-5"><h3 className="font-semibold text-gray-800">Awards</h3></Card>
        </div>
      </div>
    </div>
  );
};

export default ViewDoctor;