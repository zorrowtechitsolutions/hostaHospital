// src/Authentication/Login.jsx - COMPLETE UPDATED VERSION (JWT-Only Architecture)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building } from 'lucide-react';
import { Input, Button, Alert, Card } from '../components/ui';
import { showSuccessToast, showErrorToast, showWarningToast } from '../components/ui/Toast';
import { useLoginHospitalMutation } from '../../app/service/hospitalApi';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginHospital, { isLoading: isApiLoading }] = useLoginHospitalMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setLoginError('');
      
      try {
        const response = await loginHospital({
          email: formData.email,
          password: formData.password
        }).unwrap();
        
        console.log("✅ Login successful - Response:", response);
        
        // STORE ONLY TOKEN IN LOCALSTORAGE (JWT is the single source of truth)
        const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
        
        if (token) {
          localStorage.setItem("accessToken", token);
          console.log("✅ Access token stored successfully");
          
          // Optional: Verify token is valid (for debugging)
          try {
            const decoded = jwtDecode(token);
            console.log("✅ Token decoded successfully - Hospital ID:", decoded.id);
            console.log("Token expiration:", new Date(decoded.exp * 1000).toLocaleString());
          } catch (decodeError) {
            console.warn("Could not decode token:", decodeError);
          }
        } else {
          console.warn("⚠️ No token found in response. Response structure:", Object.keys(response));
        }
        
        // Extract hospital data from response for auth context
        const hospitalData = response.data || response.hospital || response.user || response;
        
        const authData = {
          id: hospitalData?.id || hospitalData?.hospitalId || 1,
          name: hospitalData?.name || hospitalData?.hospitalName || "Hospital",
          email: hospitalData?.email || formData.email,
          phone: hospitalData?.phone || hospitalData?.mobileNumber || "",
          type: hospitalData?.type || hospitalData?.hospitalType || "",
        };
        
        console.log("👤 Auth data being passed to context:", authData);
        
        // Call login from auth context
        await login(authData);
        
        showSuccessToast(`Login successful! Welcome back, ${authData.name}!`, 4000);
        
        setIsSubmitting(false);
        
        // Navigate to dashboard
        navigate("/dashboard", { replace: true });
        
      } catch (error) {
        console.error("❌ Login error details:", error);
        
        let errorMessage = "Invalid email or password. Please try again.";
        
        if (error.data?.message) {
          errorMessage = error.data.message;
        } else if (error.status === 401) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (error.status === 404) {
          errorMessage = "Account not found. Please register first.";
        } else if (error.status === 400) {
          errorMessage = error.data?.message || "Invalid request. Please check your credentials.";
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
            <div className="w-16 h-16 bg-[#154A7D] rounded-2xl flex items-center justify-center shadow-lg">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Hospital Admin</h2>
          <p className="text-sm text-gray-500 mt-2">Sign in to your hospital management account</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {loginError && <Alert type="error" message={loginError} />}

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
              disabled={isSubmitting || isApiLoading}
              loading={isSubmitting || isApiLoading}
            >
              {isSubmitting || isApiLoading ? 'Signing In...' : 'Sign In'}
            </Button>

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