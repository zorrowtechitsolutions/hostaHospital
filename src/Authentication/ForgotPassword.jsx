// src/Authentication/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Input, Button, Alert, Card } from '../components/ui';
import { showSuccessToast, showErrorToast, showWarningToast } from '../components/ui/Toast';
import { 
  useSendOtpMutation, 
  useVerifyOtpMutation, 
  useResetPasswordMutation 
} from '../../app/service/hospitalApi';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [resetPassword, { isLoading: isResettingPassword }] = useResetPasswordMutation();

  // Validate email
  const validateEmail = (emailValue) => {
    if (!emailValue) return 'Email is required';
    if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(emailValue)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Validate password
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return '';
  };

  // Handle Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    
    try {
      await sendOtp({ email }).unwrap();
      
      showSuccessToast('📧 OTP sent to your email! Please check your inbox.', 4000);
      setStep(2);
      
      // Start resend timer (60 seconds)
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      const errorMessage = error.data?.message || "Failed to send OTP. Please try again.";
      setError(errorMessage);
      showErrorToast(`❌ ${errorMessage}`, 4000);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsResending(true);
    try {
      await sendOtp({ email }).unwrap();
      showSuccessToast('📧 OTP resent successfully!', 4000);
      
      // Reset timer
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      const errorMessage = error.data?.message || "Failed to resend OTP";
      showErrorToast(`❌ ${errorMessage}`, 4000);
    } finally {
      setIsResending(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    
    try {
      await verifyOtp({ email, otp }).unwrap();
      
      showSuccessToast('✅ OTP verified successfully!', 3000);
      setStep(3);
      
    } catch (error) {
      const errorMessage = error.data?.message || "Invalid OTP. Please try again.";
      setError(errorMessage);
      showErrorToast(`❌ ${errorMessage}`, 4000);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await resetPassword({ 
        email, 
        newPassword 
      }).unwrap();
      
      showSuccessToast('🔐 Password reset successfully! Please login with your new password.', 5000);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/sign-in');
      }, 2000);
      
    } catch (error) {
      const errorMessage = error.data?.message || "Failed to reset password. Please try again.";
      setError(errorMessage);
      showErrorToast(`❌ ${errorMessage}`, 4000);
    }
  };

  // Render Step 1: Email Input
  const renderEmailStep = () => (
    <form onSubmit={handleSendOtp} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#154A7D] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Forgot Password?</h3>
        <p className="text-sm text-gray-500 mt-2">
          Enter your registered email address and we'll send you an OTP to reset your password.
        </p>
      </div>
      
      {error && <Alert type="error" message={error} />}
      
      <Input
        label="Email Address"
        type="email"
        placeholder="hospital@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError('');
        }}
        icon={Mail}
        required
      />
      
      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        disabled={isSendingOtp}
        loading={isSendingOtp}
      >
        {isSendingOtp ? 'Sending OTP...' : 'Send Reset OTP'}
      </Button>
      
      <div className="text-center">
        <Link to="/sign-in" className="text-sm text-[#154A7D] hover:text-[#0e3a61] inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </form>
  );

  // Render Step 2: OTP Verification
  const renderOtpStep = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Verify OTP</h3>
        <p className="text-sm text-gray-500 mt-2">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
      </div>
      
      {error && <Alert type="error" message={error} />}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Enter OTP <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
            setError('');
          }}
          className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none transition-all"
          placeholder="------"
          maxLength={6}
          autoFocus
        />
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Change Email
        </button>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resendTimer > 0 || isResending}
          className={`text-[#154A7D] hover:text-[#0e3a61] ${
            resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : isResending ? 'Resending...' : 'Resend OTP'}
        </button>
      </div>
      
      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        disabled={isVerifyingOtp || !otp || otp.length < 4}
        loading={isVerifyingOtp}
      >
        {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
      </Button>
    </form>
  );

  // Render Step 3: Reset Password
  const renderResetPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
        <p className="text-sm text-gray-500 mt-2">
          Create a new password for your account
        </p>
      </div>
      
      {error && <Alert type="error" message={error} />}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setError('');
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none transition-all"
          placeholder="Enter new password (min 8 characters)"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm New Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError('');
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none transition-all"
          placeholder="Confirm new password"
        />
      </div>
      
      <Alert 
        type="info" 
        message="Password must be at least 8 characters long." 
      />
      
      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        disabled={isResettingPassword || !newPassword || !confirmPassword}
        loading={isResettingPassword}
      >
        {isResettingPassword ? 'Resetting Password...' : 'Reset Password'}
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="p-8">
          {step === 1 && renderEmailStep()}
          {step === 2 && renderOtpStep()}
          {step === 3 && renderResetPasswordStep()}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;