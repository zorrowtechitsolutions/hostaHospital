// src/Authentication/Login.jsx - COMPLETE WITH PLATFORM
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building, ChevronDown } from 'lucide-react';
import { Input, Button, Alert, Card } from '../components/ui';
import { showSuccessToast, showErrorToast, showWarningToast } from '../components/ui/Toast';
import { useLoginMutation } from '../../app/service/hospitalApi';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { generateTokenWithTimeout, isFCMAvailable } from "../notification/firebase";
import logo from "../assets/logo.jpeg";

import { tokenManager } from '../utils/fcmTokenManager';
import { getDeviceId } from '../utils/deviceManager';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginUser, { isLoading: isLoginLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [showHospitalSelect, setShowHospitalSelect] = useState(false);
  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [detectedRole, setDetectedRole] = useState('');
  const [pendingResponse, setPendingResponse] = useState(null);
  const [pendingFcmToken, setPendingFcmToken] = useState(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isLoading = isLoginLoading || isSubmitting;

  useEffect(() => {
    const initDB = async () => {
      try {
        await tokenManager.init();
        const deviceId = getDeviceId();
        console.log('📱 Device ID:', deviceId);
      } catch (error) {
        console.error('❌ Failed to initialize IndexedDB:', error);
      }
    };
    initDB();
  }, []);

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLoginError('');
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = ['email', 'password'];
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginWithHospital = async (hospitalId) => {
    setIsSubmitting(true);
    setLoginError('');
    
    try {
      const response = pendingResponse;
      const fcmToken = pendingFcmToken;
      
      if (fcmToken) {
        try {
          await tokenManager.addFCMToken(fcmToken);
          console.log('✅ FCM token saved to IndexedDB');
        } catch (dbError) {
          console.error('❌ Failed to save token to IndexedDB:', dbError);
        }
      }
      
      processSuccessfulLogin(response, fcmToken, selectedHospital);
      
    } catch (error) {
      let errorMessage = "Invalid email or password. Please try again.";
      if (error.data?.message) {
        errorMessage = error.data.message;
      }
      setLoginError(errorMessage);
      showErrorToast(`❌ ${errorMessage}`, 4000);
      setIsSubmitting(false);
    }
  };

  const processSuccessfulLogin = (response, fcmToken, hospital = null) => {
    const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
    const roleId = response.roleId || response.data?.roleId;
    const deviceId = getDeviceId();
    
    if (token) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("deviceId", deviceId);
      
      if (roleId) {
        localStorage.setItem("roleId", roleId.toString());
      }
      
      let role = response.roleDetected || response.role || response.userType;
      
      if (Number(roleId) === 1) {
        role = "super_admin";
      }
      
      if (role) {
        let cleanRole = role;
        if (role.includes('/')) {
          if (role.includes('doctor')) cleanRole = 'doctor';
          else if (role.includes('staff')) cleanRole = 'staff';
          else if (role.includes('hospital')) cleanRole = 'hospital';
          else if (role.includes('super_admin')) cleanRole = 'super_admin';
        }
        localStorage.setItem("userRole", cleanRole);
      }
      
      if (response.authPermission?.data) {
        localStorage.setItem("permissions", JSON.stringify(response.authPermission.data));
      } else if (response.permissions) {
        localStorage.setItem("permissions", JSON.stringify(response.permissions));
      }
      
      if (hospital) {
        localStorage.setItem("hospitalInfo", JSON.stringify(hospital));
      }
      
      try {
        jwtDecode(token);
      } catch (decodeError) {
        // Silent
      }
    }
    
    const userData = response.data || response.user || response;
    let role = response.roleDetected || response.role || response.userType || 'hospital';
    
    if (Number(roleId) === 1) {
      role = "super_admin";
    }
    
    if (role && role.includes('/')) {
      if (role.includes('doctor')) role = 'doctor';
      else if (role.includes('staff')) role = 'staff';
      else if (role.includes('hospital')) role = 'hospital';
      else if (role.includes('super_admin')) role = 'super_admin';
    }
    
    localStorage.setItem("userData", JSON.stringify(userData));
    
    let authData = {
      deviceId: deviceId,
      fcmToken: fcmToken,
      platform: 'web',  // ✅ Store platform in auth data
    };
    
    if (role === 'super_admin') {
      authData = {
        ...authData,
        id: userData?.id || response.id,
        name: userData?.name || userData?.displayName || 'Super Admin',
        email: userData?.email || formData.email,
        phone: userData?.phone || '',
        role: 'super_admin',
        roleId: roleId,
        isSuperAdmin: true,
      };
      
      if (userData?.id || response.id) {
        localStorage.setItem("superAdminId", (userData?.id || response.id).toString());
      }
      
    } else if (role === 'doctor') {
      const doctorName = userData?.displayName || 
                         (userData?.firstName && userData?.lastName 
                           ? `${userData.firstName} ${userData.lastName}`.trim() 
                           : userData?.name) || 
                         'Doctor';
      
      authData = {
        ...authData,
        id: userData?.id,
        doctorId: userData?.id,
        roleId: roleId,
        hospitalId: userData?.hospitalId || hospital?.hospitalId,
        hospitalName: userData?.hospitalName || hospital?.hospitalName,
        name: doctorName,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        displayName: userData?.displayName,
        email: userData?.email,
        phone: userData?.phone,
        department: userData?.department,
        specialist: userData?.specialist,
        qualification: userData?.qualification,
        regNo: userData?.regNo,
        experience: userData?.experience,
        imageUrl: userData?.imageUrl,
        role: role,
      };
      
      if (userData?.id) {
        localStorage.setItem("doctorId", userData.id.toString());
      }
      
    } else if (role === 'staff') {
      authData = {
        ...authData,
        id: userData?.id,
        staffId: userData?.id,
        roleId: roleId,
        hospitalId: userData?.hospitalId || hospital?.hospitalId,
        hospitalName: userData?.hospitalName || hospital?.hospitalName,
        name: userData?.name || userData?.displayName || 'Staff',
        email: userData?.email,
        phone: userData?.phone,
        designation: userData?.designation,
        staffType: userData?.staffType,
        role: role,
      };
      
      if (userData?.id) {
        localStorage.setItem("staffId", userData.id.toString());
      }
      
    } else {
      authData = {
        ...authData,
        id: userData?.id || userData?.hospitalId || hospital?.hospitalId || 1,
        roleId: roleId,
        hospitalId: userData?.id || userData?.hospitalId || hospital?.hospitalId,
        hospitalName: userData?.name || userData?.hospitalName || hospital?.hospitalName || 'Hospital',
        name: userData?.name || userData?.hospitalName || hospital?.hospitalName || 'Hospital',
        email: userData?.email || formData.email,
        phone: userData?.phone || '',
        role: role,
      };
    }
    
    localStorage.setItem("authData", JSON.stringify(authData));
    login(authData);
    
    let welcomeMessage = '';
    if (role === 'super_admin') {
      welcomeMessage = `Welcome Super Admin ${authData.name}!`;
    } else if (role === 'doctor') {
      welcomeMessage = `Welcome Dr. ${authData.name}!`;
    } else if (role === 'staff') {
      welcomeMessage = `Welcome ${authData.name}!`;
    } else {
      welcomeMessage = `Welcome back, ${authData.name}!`;
    }
    
    showSuccessToast(welcomeMessage, 4000);
    setIsSubmitting(false);
    setShowHospitalSelect(false);
    setPendingResponse(null);
    setPendingFcmToken(null);
    
    const storedRoleId = Number(localStorage.getItem("roleId"));
    const userRole = localStorage.getItem("userRole");
    
    if (storedRoleId === 1 || userRole === "super_admin") {
      navigate("/super-admin/dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  // ✅ MAIN LOGIN HANDLER WITH PLATFORM
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setLoginError('');
      
      try {
        const deviceId = getDeviceId();
        console.log('📱 Device ID for login:', deviceId);
        
        // Get FCM token
        let fcmToken = null;
        if (isFCMAvailable()) {
          try {
            fcmToken = await generateTokenWithTimeout(10000);
          } catch (tokenError) {
            console.warn('⚠️ FCM token generation failed:', tokenError.message);
          }
        }
        
        // ✅ Build login payload with platform
        const loginPayload = {
          email: formData.email,
          password: formData.password,
          deviceId: deviceId,
          platform: 'web',  // ✅ SEND PLATFORM TO BACKEND
        };
        
        if (fcmToken) {
          loginPayload.fcmToken = fcmToken;
        }
        
        console.log('📤 Sending login request with platform:', loginPayload.platform);
        console.log('📤 Payload:', JSON.stringify({
          ...loginPayload,
          password: '******'
        }, null, 2));
        
        // ✅ ONE API call
        const response = await loginUser(loginPayload).unwrap();
        console.log('📥 Login response received');
        
        const roleId = response.roleId || response.data?.roleId;
        
        // ✅ Save FCM token to IndexedDB
        if (fcmToken) {
          try {
            await tokenManager.addFCMToken(fcmToken);
            console.log('✅ FCM token saved to IndexedDB');
          } catch (dbError) {
            console.error('❌ Failed to save token:', dbError);
          }
        }
        
        // ✅ Check if Super Admin
        if (Number(roleId) === 1) {
          processSuccessfulLogin(response, fcmToken, null);
          return;
        }
        
        // ✅ Check if multiple hospitals
        if (response.hospitals && response.hospitals.length > 1) {
          setPendingResponse(response);
          setPendingFcmToken(fcmToken);
          setHospitalOptions(response.hospitals || []);
          setDetectedRole(response.roleDetected || '');
          setShowHospitalSelect(true);
          setIsSubmitting(false);
          showWarningToast('⚠️ Please select a hospital to continue', 3000);
          return;
        }
        
        // ✅ Single hospital
        const singleHospital = response.hospitals && response.hospitals.length === 1 
          ? response.hospitals[0] 
          : null;
        processSuccessfulLogin(response, fcmToken, singleHospital);
        
      } catch (error) {
        let errorMessage = "Invalid email or password. Please try again.";
        
        if (error.data?.message) {
          errorMessage = error.data.message;
        } else if (error.status === 401) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (error.status === 404) {
          errorMessage = "Account not found. Please register first.";
        } else if (error.status === 400) {
          errorMessage = error.data?.message || "Invalid request. Please check your credentials.";
        } else if (error.status === 403) {
          errorMessage = "You don't have permission to access this account.";
        }
        
        setLoginError(errorMessage);
        showErrorToast(`❌ ${errorMessage}`, 4000);
        setIsSubmitting(false);
      }
    } else {
      showWarningToast('⚠️ Please fill in all required fields correctly', 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logo}
              alt="Hosta Logo"
              className="h-20 w-20 rounded-2xl shadow-lg border-2 border-blue-100 object-cover"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Login to your account</h2>
          <p className="text-sm text-gray-500 mt-2">Welcome back! Please enter your details.</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {loginError && <Alert type="error" message={loginError} />}

            {showHospitalSelect && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Hospital <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <select
                    value={selectedHospital?.hospitalId || ""}
                    onChange={(e) => {
                      const hospital = hospitalOptions.find(
                        h => h.hospitalId === Number(e.target.value)
                      );
                      setSelectedHospital(hospital);
                    }}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-[#154A7D] outline-none transition appearance-none bg-white text-sm"
                  >
                    <option value="">Select Hospital</option>
                    {hospitalOptions.map((hospital) => (
                      <option key={hospital.hospitalId} value={hospital.hospitalId}>
                        {hospital.hospitalName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {selectedHospital && (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => handleLoginWithHospital(selectedHospital.hospitalId)}
                    className="mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg"
                  >
                    Continue with {selectedHospital.hospitalName}
                  </Button>
                )}
              </div>
            )}

            {!showHospitalSelect && (
              <>
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="hospital@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.email}
                  touched={touched.email}
                  icon={Mail}
                  required
                />

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <Link to="/forgot-password" className="text-xs text-[#154A7D] hover:text-[#0e3a61]">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-9 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all text-sm
                        ${errors.password && touched.password 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-[#154A7D]'
                        }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                  {errors.password && touched.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={isLoading}
                  loading={isLoading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </>
            )}

            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#154A7D] hover:text-[#0e3a61] font-medium">
                Sign Up
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;