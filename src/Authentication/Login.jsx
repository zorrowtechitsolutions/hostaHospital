// src/Authentication/Login.jsx - WITH SKELETON LOADING (Neutral Colors)
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

// ✅ Skeleton Loader Component for Login (Neutral Colors - Matching Doctor Skeleton)
const LoginSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-2xl bg-gray-200 animate-pulse border-2 border-blue-100"></div>
          </div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Icon Placeholder */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          </div>

          {/* Email Field Skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Password Field Skeleton */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Submit Button Skeleton - Neutral gray like Doctor skeleton */}
          <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse"></div>

          {/* Footer Links Skeleton */}
          <div className="mt-6 flex justify-center">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginUser, { isLoading: isLoginLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
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

  // ✅ Simulate initial loading for skeleton
  useEffect(() => {
    const initDB = async () => {
      try {
        await tokenManager.init();
        const deviceId = getDeviceId();
      } catch (error) {
        console.error('❌ Failed to initialize IndexedDB:', error);
      } finally {
        // ✅ Hide skeleton after initialization (or after a minimum time)
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 500);
      }
    };
    initDB();
  }, []);

  // ✅ Show skeleton while initializing
  if (isInitialLoading) {
    return <LoginSkeletonLoader />;
  }

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
        } catch (dbError) {
          console.error('❌ Failed to save token to IndexedDB:', dbError);
        }
      }
      
      processSuccessfulLogin(response, fcmToken, selectedHospital);
      
    } catch (error) {
      localStorage.clear();
      
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
    
    let role = 
      response.roleDetected ||
      response.role ||
      response.data?.role ||
      response.user?.role ||
      response.userType ||
      "hospital";
    
    console.log("🔍 ROLE EXTRACTION:", {
      "response.roleDetected": response.roleDetected,
      "response.role": response.role,
      "response.data?.role": response.data?.role,
      "response.user?.role": response.user?.role,
      "response.userType": response.userType,
      "initialRole": role
    });
    
    if (Number(roleId) === 1) {
      role = "super_admin";
    }
    
    if (role && role.includes('/')) {
      if (role.includes('doctor')) role = 'doctor';
      else if (role.includes('staff')) role = 'staff';
      else if (role.includes('hospital')) role = 'hospital';
      else if (role.includes('super_admin')) role = 'super_admin';
    }
    
    console.log("🎯 FINAL ROLE =", role);
    
    if (token) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("deviceId", deviceId);
      
      if (roleId) {
        localStorage.setItem("roleId", roleId.toString());
      }
      
      localStorage.setItem("userRole", role);
      
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
    localStorage.setItem("userData", JSON.stringify(userData));
    
    let authData = {
      deviceId: deviceId,
      fcmToken: fcmToken,
      platform: 'web',
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
        doctorId: userData?.doctorId || response.data?.doctorId,
        roleId: roleId,
        hospitalId: userData?.hospitalId || hospital?.hospitalId || response.data?.hospitalId,
        hospitalName: userData?.hospitalName || hospital?.hospitalName || response.data?.hospitalName,
        name: doctorName,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        displayName: userData?.displayName,
        email: userData?.email || response.data?.email,
        phone: userData?.phone,
        department: userData?.department || response.data?.department,
        specialist: userData?.specialist || response.data?.specialist,
        qualification: userData?.qualification || response.data?.qualification,
        regNo: userData?.regNo || response.data?.regNo,
        experience: userData?.experience || response.data?.experience,
        imageUrl: userData?.imageUrl || response.data?.imageUrl,
        role: role,
      };
      
      if (userData?.doctorId || response.data?.doctorId) {
        localStorage.setItem("doctorId", (userData?.doctorId || response.data?.doctorId).toString());
      }
      
    } else if (role === 'staff') {
  const authId = userData?.id || response.id;
  const staffTableId =
    userData?.staffId ||
    response.data?.staffId ||
    response.staffId;

  const staffName =
    userData?.staffName ||
    userData?.displayName ||
    userData?.name ||
    `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
    "Staff";

  console.log("🔑 STAFF ID FIX:", {
    authId,
    staffTableId,
    staffName,
    userData,
  });

  authData = {
    ...authData,
    id: authId,
    authId: authId,
    staffId: staffTableId,
    roleId: roleId,
    hospitalId:
      userData?.hospitalId ||
      hospital?.hospitalId ||
      response.data?.hospitalId,
    hospitalName:
      userData?.hospitalName ||
      hospital?.hospitalName ||
      response.data?.hospitalName,

    // ✅ Fixed
    name: staffName,
    displayName: staffName,

    email: userData?.email || response.data?.email,
    phone: userData?.phone,
    designation:
      userData?.designation || response.data?.designation,
    staffType:
      userData?.staffType || response.data?.staffType,
    role: role,
  };

  if (staffTableId) {
    localStorage.setItem("staffId", staffTableId.toString());
    console.log("✅ Stored staffId:", staffTableId);
  } else {
    console.warn("⚠️ No staffId found in response");
  }

  if (authId) {
    localStorage.setItem("authId", authId.toString());
  }

      
    } else {
      authData = {
        ...authData,
        id: userData?.id || response.id || response.data?.id || 1,
        hospitalId: userData?.hospitalId || hospital?.hospitalId || response.data?.hospitalId || response.id,
        roleId: roleId,
        hospitalName: userData?.hospitalName || hospital?.hospitalName || userData?.name || response.data?.hospitalName || 'Hospital',
        name: userData?.hospitalName || hospital?.hospitalName || userData?.name || response.data?.hospitalName || 'Hospital',
        email: userData?.email || response.data?.email || formData.email,
        phone: userData?.phone || '',
        role: role,
      };
    }
    
    console.log("📦 AUTH DATA =", authData);
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setLoginError('');
      
      try {
        const deviceId = getDeviceId();
        
        let fcmToken = null;
        
        if (isFCMAvailable()) {
          try {
            fcmToken = await generateTokenWithTimeout(10000);
          } catch (tokenError) {
            console.warn('⚠️ FCM token generation failed:', tokenError.message);
          }
        }
        
        const loginPayload = {
          email: formData.email,
          password: formData.password,
          fcmToken: fcmToken ? {
            deviceId: deviceId,
            platform: 'web',
            fcmToken: fcmToken
          } : undefined
        };
        
        const response = await loginUser(loginPayload).unwrap();
        
        const roleId = response.roleId || response.data?.roleId;
        
        if (fcmToken) {
          try {
            await tokenManager.addFCMToken(fcmToken);
          } catch (dbError) {
            console.error('❌ Failed to save token to IndexedDB:', dbError);
          }
        }
        
        if (Number(roleId) === 1) {
          processSuccessfulLogin(response, fcmToken, null);
          return;
        }
        
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
        
        const singleHospital = response.hospitals && response.hospitals.length === 1 
          ? response.hospitals[0] 
          : null;
        processSuccessfulLogin(response, fcmToken, singleHospital);
        
      } catch (error) {
        localStorage.clear();
        
        console.error('❌ Login error:', error);
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