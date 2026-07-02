// src/Authentication/Login.jsx - COMPLETE UPDATED VERSION with Logo & Fixed Loading Issue
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building, ChevronDown } from 'lucide-react';
import { Input, Button, Alert, Card } from '../components/ui';
import { showSuccessToast, showErrorToast, showWarningToast } from '../components/ui/Toast';
import { useLoginHospitalMutation } from '../../app/service/hospitalApi';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { generateToken } from "../notification/firebase";
import logo from "../assets/logo.jpeg";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginHospital, { isLoading: isHospitalLoading }] = useLoginHospitalMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Multi-hospital selection states
  const [showHospitalSelect, setShowHospitalSelect] = useState(false);
  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [detectedRole, setDetectedRole] = useState('');
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isLoading = isHospitalLoading || isSubmitting;

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

  // Handle login after hospital selection
  const handleLoginWithHospital = async (hospitalId) => {
    setIsSubmitting(true);
    setLoginError('');
    
    try {
      // ✅ Get FCM token with timeout to prevent hanging
      let fcmToken = null;
      try {
        const tokenPromise = generateToken();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('FCM token generation timeout')), 5000)
        );
        fcmToken = await Promise.race([tokenPromise, timeoutPromise]);
      } catch (tokenError) {
        // Silently handle token error and continue
        console.warn('FCM token not available, continuing without it');
      }
      
      const loginPayload = {
        email: formData.email,
        password: formData.password,
        hospitalId: hospitalId
      };
      
      if (fcmToken) {
        loginPayload.fcmToken = fcmToken;
      }
      
      const response = await loginHospital(loginPayload).unwrap();
      
      // Process successful login
      processSuccessfulLogin(response, fcmToken, selectedHospital);
      
    } catch (error) {
      let errorMessage = "Invalid email or password. Please try again.";
      
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.status === 401) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.status === 404) {
        errorMessage = "Account not found. Please register first.";
      } else if (error.status === 403) {
        errorMessage = "You don't have permission to access this hospital.";
      }
      
      setLoginError(errorMessage);
      showErrorToast(`❌ ${errorMessage}`, 4000);
      setIsSubmitting(false);
    }
  };

  // Process successful login and store data
  const processSuccessfulLogin = (response, fcmToken, hospital = null) => {
    const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
    
    // EXTRACT ROLE ID ONCE
    const roleId = response.roleId || response.data?.roleId;
    
    if (token) {
      localStorage.setItem("accessToken", token);
      
      // Store roleId if present (for Super Admin detection)
      if (roleId) {
        localStorage.setItem("roleId", roleId.toString());
      }
      
      // Store detected role from response
      let role = response.roleDetected || response.role || response.userType;
      
      // Super Admin handling
      if (Number(roleId) === 1) {
        role = "super_admin";
      }
      
      if (role) {
        // Clean up role URL if needed (extract only the role name)
        let cleanRole = role;
        if (role.includes('/')) {
          if (role.includes('doctor')) cleanRole = 'doctor';
          else if (role.includes('staff')) cleanRole = 'staff';
          else if (role.includes('hospital')) cleanRole = 'hospital';
          else if (role.includes('super_admin')) cleanRole = 'super_admin';
        }
        localStorage.setItem("userRole", cleanRole);
      }
      
      // Store permissions from login API response
      if (response.authPermission?.data) {
        localStorage.setItem("permissions", JSON.stringify(response.authPermission.data));
      } else if (response.permissions) {
        localStorage.setItem("permissions", JSON.stringify(response.permissions));
      }
      
      // Store hospital info if selected (for reference)
      if (hospital) {
        localStorage.setItem("hospitalInfo", JSON.stringify(hospital));
      }
      
      // Verify token
      try {
        jwtDecode(token);
      } catch (decodeError) {
        // Silently handle decode error
      }
    }
    
    // Extract user data from response (this contains the actual profile data)
    const userData = response.data || response.user || response;
    let role = response.roleDetected || response.role || response.userType || 'hospital';
    
    // Super Admin handling for role variable using the extracted roleId
    if (Number(roleId) === 1) {
      role = "super_admin";
    }
    
    // Clean up role URL if needed
    if (role && role.includes('/')) {
      if (role.includes('doctor')) role = 'doctor';
      else if (role.includes('staff')) role = 'staff';
      else if (role.includes('hospital')) role = 'hospital';
      else if (role.includes('super_admin')) role = 'super_admin';
    }
    
    // Store complete user data for profile page
    localStorage.setItem("userData", JSON.stringify(userData));
    
    // ✅ Build authData based on role with roleId added to ALL roles
    let authData = {};
    
    if (role === 'super_admin') {
      // Super Admin - special handling
      authData = {
        id: userData?.id || response.id,
        name: userData?.name || userData?.displayName || 'Super Admin',
        email: userData?.email || formData.email,
        phone: userData?.phone || '',
        role: 'super_admin',
        roleId: roleId, // ✅ Added roleId
        isSuperAdmin: true,
        fcmToken: fcmToken
      };
      
      // Store super admin ID
      if (userData?.id || response.id) {
        localStorage.setItem("superAdminId", (userData?.id || response.id).toString());
      }
      
    } else if (role === 'doctor') {
      // Doctor - use full doctor profile from response.data
      const doctorName = userData?.displayName || 
                         (userData?.firstName && userData?.lastName 
                           ? `${userData.firstName} ${userData.lastName}`.trim() 
                           : userData?.name) || 
                         'Doctor';
      
      authData = {
        id: userData?.id,
        doctorId: userData?.id,
        roleId: roleId, // ✅ Added roleId
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
        fcmToken: fcmToken
      };
      
      // Store doctor-specific IDs
      if (userData?.id) {
        localStorage.setItem("doctorId", userData.id.toString());
      }
      
    } else if (role === 'staff') {
      // ✅ Staff - with roleId added
      authData = {
        id: userData?.id,
        staffId: userData?.id,
        roleId: roleId, // ✅ Added roleId
        hospitalId: userData?.hospitalId || hospital?.hospitalId,
        hospitalName: userData?.hospitalName || hospital?.hospitalName,
        name: userData?.name || userData?.displayName || 'Staff',
        email: userData?.email,
        phone: userData?.phone,
        designation: userData?.designation,
        staffType: userData?.staffType,
        role: role,
        fcmToken: fcmToken
      };
      
      // Store staff-specific IDs
      if (userData?.id) {
        localStorage.setItem("staffId", userData.id.toString());
      }
      
    } else {
      // ✅ Hospital admin - with roleId added
      authData = {
        id: userData?.id || userData?.hospitalId || hospital?.hospitalId || 1,
        roleId: roleId, // ✅ Added roleId
        hospitalId: userData?.id || userData?.hospitalId || hospital?.hospitalId,
        hospitalName: userData?.name || userData?.hospitalName || hospital?.hospitalName || 'Hospital',
        name: userData?.name || userData?.hospitalName || hospital?.hospitalName || 'Hospital',
        email: userData?.email || formData.email,
        phone: userData?.phone || '',
        role: role,
        fcmToken: fcmToken
      };
    }
    
    // Store complete auth data in localStorage for easy access
    localStorage.setItem("authData", JSON.stringify(authData));
    
    // Call login from auth context
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
    
    // REDIRECT BASED ON ROLE with proper roleId check
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
      
      // ✅ Add debug logs to identify where the code hangs
      console.log("🔍 1. Submit clicked - Starting login process");
      
      try {
        // ✅ Get FCM token with timeout to prevent hanging
        let fcmToken = null;
        try {
          console.log("🔍 2. Before generateToken");
          const tokenPromise = generateToken();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('FCM token generation timeout')), 5000)
          );
          fcmToken = await Promise.race([tokenPromise, timeoutPromise]);
          console.log("🔍 3. After generateToken - Token:", fcmToken ? "Received" : "Null");
        } catch (tokenError) {
          console.warn('🔍 3. FCM token error:', tokenError.message);
          // Silently handle token error and continue
        }
        
        const loginPayload = {
          email: formData.email,
          password: formData.password
        };
        
        if (fcmToken) {
          loginPayload.fcmToken = fcmToken;
        }
        
        console.log("🔍 4. Login payload prepared:", { email: loginPayload.email, hasFcmToken: !!fcmToken });
        
        // FIRST: Try Super Admin login
        let response;
        let isSuperAdmin = false;
        
        try {
          console.log("🔍 5. Attempting Super Admin login...");
          response = await loginSuperAdmin(loginPayload).unwrap();
<<<<<<< HEAD
          console.log("LOGIN RESPONSE:", response);
          console.log("ROLE ID:", response.roleId);
          console.log("DATA ROLE ID:", response.data?.roleId);
=======
          console.log("🔍 6. Super Admin login response received");
>>>>>>> 67b76a70f7c195ace9018077654361edc4f774f9
          
          // Extract roleId from response
          const roleId = response.roleId || response.data?.roleId;
          console.log("🔍 7. Super Admin roleId:", roleId);
          
          // Check if it's a Super Admin (roleId === 1)
          if (Number(roleId) === 1) {
            isSuperAdmin = true;
          } else {
            // If not Super Admin, throw to try hospital login
            throw new Error("Not Super Admin");
          }
        } catch (superAdminError) {
          console.log("🔍 6. Super Admin login failed, trying Hospital login...");
          // SECOND: Try hospital login
          response = await loginHospital(loginPayload).unwrap();
          console.log("🔍 7. Hospital login response received");
        }
        
        // Extract roleId from response
        const roleId = response.roleId || response.data?.roleId;
        console.log("🔍 8. Final roleId:", roleId);
        
        // SUPER ADMIN CHECK - If roleId is 1, it's Super Admin
        if (Number(roleId) === 1 || isSuperAdmin) {
          console.log("🔍 9. Processing Super Admin login...");
          processSuccessfulLogin(response, fcmToken, null);
          return;
        }
        
        // Check if multiple hospitals require selection (based on hospitals array length > 1)
        if (response.hospitals && response.hospitals.length > 1) {
          console.log("🔍 9. Multiple hospitals found, showing selection...");
          setHospitalOptions(response.hospitals || []);
          setDetectedRole(response.roleDetected || '');
          setShowHospitalSelect(true);
          setIsSubmitting(false);
          return;
        }
        
        // If only one hospital or direct login, process normally
        // Extract the single hospital if it exists
        const singleHospital = response.hospitals && response.hospitals.length === 1 ? response.hospitals[0] : null;
        console.log("🔍 9. Processing login with single hospital...");
        processSuccessfulLogin(response, fcmToken, singleHospital);
        
      } catch (error) {
        console.error("🔍 Login error:", error);
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

            {/* Hospital Selection Dropdown (shown when multiple hospitals) */}
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
                    className="mt-3"
                  >
                    Continue with {selectedHospital.hospitalName}
                  </Button>
                )}
              </div>
            )}

            {/* Regular Login Form (hidden when hospital selection is shown) */}
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
                  className="
                    bg-gradient-to-r
                    from-green-600
                    to-emerald-600
                    hover:from-green-700
                    hover:to-emerald-700
                    text-white
                    border-0
                    shadow-lg
                  "
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
