import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Phone, Calendar, ArrowRight, CheckCircle, X } from 'lucide-react';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthDate: '',
    gender: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // 로그인된 사용자는 메인 페이지로 리다이렉트
  useEffect(() => {
    // userManager가 있다면 체크 (없으면 스킵)
    try {
      if (window.userManager && window.userManager.isLoggedIn && window.userManager.isLoggedIn()) {
        window.location.href = '/';
      }
    } catch (error) {
      // userManager가 없어도 무시
    }
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 실시간 유효성 검사 - 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름은 2글자 이상 입력해주세요';
    }

    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } 

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    // 생년월일 검증
    if (!formData.birthDate) {
      newErrors.birthDate = '생년월일을 선택해주세요';
    } else {
      const selectedDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - selectedDate.getFullYear();
      if (age < 14) {
        newErrors.birthDate = '14세 이상만 가입할 수 있습니다';
      } else if (age > 100) {
        newErrors.birthDate = '올바른 생년월일을 선택해주세요';
      }
    }

    // 성별 검증
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showNotification('error', '입력하신 정보를 다시 확인해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      // API 호출
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

      // 백엔드 UserDto 형식에 맞게 데이터 변환
      const requestData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        birth: formData.birthDate // LocalDate 형식으로 전송 (YYYY-MM-DD)
      };

      console.log('회원가입 요청 데이터:', requestData);

      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('회원가입 응답:', data);

      if (response.ok && data.result === 'SUCCESS') {
        // 회원가입 성공
        console.log('회원가입 성공:', data);
        
        showNotification('success', '🍓 회원가입이 완료되었습니다! 내게 딱 맞는 요금제를 찾으러 가볼까요?');
        
        // 회원가입 성공 후 자동 로그인 처리 (토큰이 있는 경우)
        if (data.data && data.data.accessToken) {
          // 토큰이 반환된 경우 자동 로그인 처리
          try {
            const { handleLoginSuccess } = await import('./auth');
            handleLoginSuccess(data);
            
            // 3초 후 메인 페이지로 리다이렉트
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          } catch (authError) {
            console.error('자동 로그인 처리 실패:', authError);
            // 자동 로그인 실패 시 로그인 페이지로 이동
            setTimeout(() => {
              window.location.href = '/login';
            }, 3000);
          }
        } else {
          // 토큰이 없는 경우 로그인 페이지로 이동
          showNotification('success', '🍓 회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
        
      } else {
        // 회원가입 실패 - 서버에서 전달한 구체적인 에러 메시지 사용
        let errorMessage = '회원가입에 실패했습니다';
        
        if (response.status === 400) {
          if (data.message) {
            errorMessage = data.message;
          } else if (data.data && data.data.message) {
            errorMessage = data.data.message;
          } else {
            errorMessage = '입력하신 정보를 다시 확인해주세요';
          }
        } else if (response.status === 409) {
          errorMessage = '이미 가입된 이메일입니다';
        } else if (response.status === 422) {
          errorMessage = '입력 형식이 올바르지 않습니다';
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        showNotification('error', errorMessage);
      }
    } catch (error) {
      console.error('회원가입 에러:', error);
      
      // 네트워크 에러 구분
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showNotification('error', '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
      } else {
        showNotification('error', '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 오늘 날짜에서 100년 전부터 14년 전까지 설정
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-25 to-red-50 flex items-center justify-center p-4">
      {/* Background Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-pink-200 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-rose-200 rounded-full opacity-30 animate-pulse delay-75"></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 bg-pink-300 rounded-full opacity-30 animate-bounce delay-150"></div>
      <div className="absolute top-60 right-10 text-4xl animate-pulse">🍓</div>
      <div className="absolute bottom-40 left-40 text-3xl animate-bounce">🥛</div>
      <div className="absolute top-32 right-32 w-24 h-24 bg-pink-100 rounded-full opacity-40 animate-pulse delay-300"></div>

      {/* Custom Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <div className={`rounded-2xl shadow-2xl p-4 border-l-4 backdrop-blur-sm transform transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-50/90 border-green-400 text-green-800'
              : 'bg-red-50/90 border-red-400 text-red-800'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <X className="w-5 h-5 text-red-400" />
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

        {/* Signup Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-pink-100">
          <div className="space-y-6">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${
                    errors.name 
                      ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                  }`}
                  placeholder="이름을 입력해주세요"
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 이메일 */}
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
                    errors.email 
                      ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                  }`}
                  placeholder="example@email.com"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${
                    errors.password 
                      ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                  }`}
                  placeholder="영문, 숫자 포함 8자 이상"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isSubmitting}
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

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${
                    errors.confirmPassword 
                      ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                  }`}
                  placeholder="비밀번호를 다시 입력해주세요"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-pink-400 hover:text-pink-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-pink-400 hover:text-pink-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* 생년월일 (Date Picker) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생년월일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  min={minDate}
                  max={maxDate}
                  className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${
                    errors.birthDate 
                      ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.birthDate && (
                <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성별
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all appearance-none ${
                  errors.gender 
                    ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                }`}
                disabled={isSubmitting}
              >
                <option value="">성별을 선택해주세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* 회원가입 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 px-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed transform-none'
                  : 'bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  가입 중...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  요플레로 시작하기 🍦
                </div>
              )}
            </button>
          </div>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => window.location.href = '/login'}
                className="text-pink-500 hover:text-pink-600 font-medium transition-colors"
              >
                로그인하기 
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

export default SignupPage;