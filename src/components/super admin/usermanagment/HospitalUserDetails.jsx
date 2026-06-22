// src/components/superadmin/usermanagement/HospitalUserDetails.jsx
import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Stethoscope, Briefcase, Shield, Calendar } from 'lucide-react';
import { Card, Button, Badge } from '../../ui';

const HospitalUserDetails = () => {
  const { hospitalId, userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, userType, hospitalName, roleName } = location.state || {};

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="text-center py-12">User not found</div>
      </div>
    );
  }

  const getRoleBadgeColor = (role) => {
    if (role === 'Admin') return 'bg-purple-100 text-purple-800';
    if (role === 'Doctor') return 'bg-blue-100 text-blue-800';
    if (role === 'Staff') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="mb-6">
        <button 
          onClick={() => navigate(`/super-admin/hospital-users/${hospitalId}/users`, { state: { hospitalName, hospitalId } })}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} /> Back to Users
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Details</h1>
            <p className="text-sm text-gray-500 mt-1">{hospitalName} • {userType}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.displayName || user.name}
              </h2>
              <p className="text-sm text-gray-500">ID: {user.id}</p>
              <div className="mt-2">
                <Badge className={getRoleBadgeColor(roleName)}>
                  <Shield size={12} className="inline mr-1" />
                  {roleName || 'No Role Assigned'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{user.email || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{user.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {userType === 'doctor' && (
              <>
                <h3 className="text-lg font-semibold text-gray-800 pt-4">Professional Information</h3>
                <div className="grid grid-cols-1 gap-3">
                  {user.speciality && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Stethoscope className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Speciality</p>
                        <p className="text-sm text-gray-900">{user.speciality}</p>
                      </div>
                    </div>
                  )}
                  {user.qualification && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Qualification</p>
                        <p className="text-sm text-gray-900">{user.qualification}</p>
                      </div>
                    </div>
                  )}
                  {user.experience && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Experience</p>
                        <p className="text-sm text-gray-900">{user.experience} years</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {userType === 'staff' && (
              <>
                <h3 className="text-lg font-semibold text-gray-800 pt-4">Employment Information</h3>
                <div className="grid grid-cols-1 gap-3">
                  {user.designation && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Designation</p>
                        <p className="text-sm text-gray-900">{user.designation}</p>
                      </div>
                    </div>
                  )}
                  {user.department && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Stethoscope className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm text-gray-900">{user.department}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/super-admin/hospital-users/${hospitalId}/permissions/${userId}`, { 
                state: { user, userType, hospitalName, roleName } 
              })}
            >
              Edit Permissions
            </Button>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/super-admin/hospital-users/${hospitalId}/users`, { state: { hospitalName, hospitalId } })}
            >
              Done
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HospitalUserDetails;