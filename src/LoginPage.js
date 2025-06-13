import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, X, AlertCircle } from 'lucide-react';
import { userManager, handleLoginSuccess } from './auth';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [notification, setNotification] = useState(null);

  // 알림 자동 닫기
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
  useEffect(() => {
    if (userManager.isLoggedIn()) {
      window.location.href = '/';
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } 
      
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({}); // 기존 에러 초기화
    
    try {
      // API 호출
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: rememberMe
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.result === 'SUCCESS') {
        // 로그인 성공
        console.log('로그인 성공:', data);
        
        // 사용자 정보가 없거나 이름이 없는 경우 처리
        if (data.data && data.data.userDto) {
          // 이메일이 null인 경우 로그인한 이메일로 설정
          if (!data.data.userDto.email) {
            data.data.userDto.email = formData.email;
          }
          
          // 이름이 없거나 비어있는 경우 이메일에서 추출
          if (!data.data.userDto.name || data.data.userDto.name.trim() === '') {
            data.data.userDto.name = formData.email.split('@')[0];
          }
        }
        
        // 토큰과 사용자 정보 저장
        handleLoginSuccess(data);
        
        // 성공 알림 표시
        showNotification('success', '로그인 성공! 메인 페이지로 이동합니다... 🍓');
        
        // 잠시 후 리다이렉트 (사용자가 성공 메시지를 볼 수 있도록)
        setTimeout(() => {
          const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/';
          localStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        }, 1500);
        
      } else {
        // 로그인 실패 - 서버에서 전달한 구체적인 에러 메시지 사용
        let errorMessage = '로그인에 실패했습니다';
        
        if (response.status === 401) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다';
        } else if (response.status === 404) {
          errorMessage = '등록되지 않은 이메일입니다';
        } else if (response.status === 423) {
          errorMessage = '계정이 잠겨있습니다. 고객센터에 문의해주세요';
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        showNotification('error', errorMessage);
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      
      // 네트워크 에러 구분
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showNotification('error', '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
      } else {
        showNotification('error', '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 찾기 처리
  const handleForgotPassword = () => {
    showNotification('info', '비밀번호 찾기 기능은 준비 중입니다 🍓');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-25 to-red-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-pink-200 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-rose-200 rounded-full opacity-30 animate-pulse delay-75"></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 bg-pink-300 rounded-full opacity-30 animate-bounce delay-150"></div>
      <div className="absolute top-60 right-10 text-4xl animate-pulse">🍓</div>
      <div className="absolute bottom-40 left-40 text-3xl animate-bounce">🥛</div>

      {/* Custom Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <div className={`rounded-2xl shadow-2xl p-4 border-l-4 backdrop-blur-sm transform transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-50/90 border-green-400 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50/90 border-red-400 text-red-800'
              : 'bg-blue-50/90 border-blue-400 text-blue-800'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : notification.type === 'error' ? (
                  <X className="w-5 h-5 text-red-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={closeNotification}
                className="ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-6">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-2xl">🍓</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  요플레
                </h1>
                <p className="text-sm text-pink-400">요금 플래너</p>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-pink-100">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                  }`}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                  }`}
                  placeholder="비밀번호를 입력하세요"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-pink-400 hover:text-pink-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-pink-400 hover:text-pink-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
              </label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-pink-500 hover:text-pink-600 transition-colors"
              >
                비밀번호 찾기
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed transform-none'
                  : 'bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  로그인 🍦
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pink-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              아직 요플레 회원이 아니신가요?{' '}
              <button
                onClick={() => window.location.href = '/signup'}
                className="text-pink-500 hover:text-pink-600 font-medium transition-colors"
              >
                회원가입하기
              </button>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center text-pink-500 hover:text-pink-600 transition-colors font-medium"
          >
            <ArrowRight className="w-4 h-4 mr-1 transform rotate-180" />
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;