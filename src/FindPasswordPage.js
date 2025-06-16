import React, { useState, useEffect } from 'react';
import { Mail, Lock, CheckCircle, X, AlertCircle, ArrowLeft, Calendar } from 'lucide-react';

const PasswordResetPage = () => {
    const [step, setStep] = useState(1); // 1: 이메일+생년월일 입력, 2: 새 비밀번호 입력
    const [formData, setFormData] = useState({
        email: '',
        birthDate: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [notification, setNotification] = useState(null);
    const [resetToken, setResetToken] = useState('');

    // URL 파라미터에서 토큰 확인 (이메일 링크로 접근한 경우)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            setResetToken(token);
            setStep(2);
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
        // 에러 메시지 초기화
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateEmailForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = '이메일을 입력해주세요';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다';
        }

        if (!formData.birthDate) {
            newErrors.birthDate = '생년월일을 입력해주세요';
        } else {
            // 생년월일 유효성 검사
            const birthDate = new Date(formData.birthDate);
            const today = new Date();
            const minDate = new Date(today.getFullYear() - 120, 0, 1); // 120년 전
            const maxDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate()); // 10년 전

            if (isNaN(birthDate.getTime())) {
                newErrors.birthDate = '올바른 날짜 형식이 아닙니다';
            } else if (birthDate < minDate || birthDate > maxDate) {
                newErrors.birthDate = '올바른 생년월일을 입력해주세요';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePasswordForm = () => {
        const newErrors = {};

        if (!formData.newPassword) {
            newErrors.newPassword = '새 비밀번호를 입력해주세요';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = '비밀번호는 최소 6자 이상이어야 합니다';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 1단계: 이메일+생년월일로 비밀번호 재설정 요청
    const handleRequestPasswordReset = async (e) => {
        if (e) e.preventDefault();

        if (!validateEmailForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

            const response = await fetch(`${API_BASE_URL}/api/users/find-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    birthDate: formData.birthDate
                })
            });

            const data = await response.json();

            if (response.ok && data.result === 'SUCCESS') {
                showNotification('success', '비밀번호 재설정 링크가 이메일로 전송되었습니다! 📧');
                // 성공 시 안내 메시지 표시
                setStep(3); // 완료 단계로 이동
            } else {
                let errorMessage = '비밀번호 재설정 요청에 실패했습니다';

                if (response.status === 404) {
                    errorMessage = '입력하신 정보와 일치하는 계정을 찾을 수 없습니다';
                } else if (response.status === 400) {
                    errorMessage = '이메일 또는 생년월일이 올바르지 않습니다';
                } else if (data.message) {
                    errorMessage = data.message;
                }

                showNotification('error', errorMessage);
            }
        } catch (error) {
            console.error('비밀번호 재설정 요청 에러:', error);

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showNotification('error', '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
            } else {
                showNotification('error', '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 2단계: 새 비밀번호 설정
    const handleResetPassword = async (e) => {
        if (e) e.preventDefault();

        if (!validatePasswordForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

            const response = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: resetToken,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (response.ok && data.result === 'SUCCESS') {
                showNotification('success', '비밀번호가 성공적으로 변경되었습니다! 🍓');

                // 잠시 후 로그인 페이지로 이동
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);

            } else {
                let errorMessage = '비밀번호 변경에 실패했습니다';

                if (response.status === 400) {
                    errorMessage = '유효하지 않은 토큰이거나 만료된 토큰입니다';
                } else if (data.message) {
                    errorMessage = data.message;
                }

                showNotification('error', errorMessage);
            }
        } catch (error) {
            console.error('비밀번호 변경 에러:', error);

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showNotification('error', '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
            } else {
                showNotification('error', '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
        } finally {
            setIsLoading(false);
        }
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
                    <div className={`rounded-2xl shadow-2xl p-4 border-l-4 backdrop-blur-sm transform transition-all duration-300 ${notification.type === 'success'
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {step === 1 ? '비밀번호 찾기' : step === 2 ? '새 비밀번호 설정' : '완료'}
                    </h2>
                    <p className="text-gray-600">
                        {step === 1 ? '가입하신 이메일과 생년월일을 입력해주세요' :
                            step === 2 ? '새로운 비밀번호를 설정해주세요' :
                                '이메일을 확인해주세요'}
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-pink-100">
                    {step === 1 && (
                        <div className="space-y-6">
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
                                        className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${errors.email ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                                            }`}
                                        placeholder="your@email.com"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Birth Date Field */}
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
                                        className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${errors.birthDate ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                                            }`}
                                        disabled={isLoading}
                                        max={new Date(new Date().getFullYear() - 10, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                                        min={new Date(new Date().getFullYear() - 120, 0, 1).toISOString().split('T')[0]}
                                    />
                                </div>
                                {errors.birthDate && (
                                    <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    회원가입 시 입력하신 생년월일을 입력해주세요
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleRequestPasswordReset}
                                disabled={isLoading}
                                className={`w-full py-4 px-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg ${isLoading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed transform-none'
                                    : 'bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        확인 중...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        비밀번호 재설정 링크 전송 📧
                                    </div>
                                )}
                            </button>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-6">
                            {/* New Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    새 비밀번호
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-pink-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${errors.newPassword ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                                            }`}
                                        placeholder="새 비밀번호를 입력하세요"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.newPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호 확인
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-pink-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white/50'
                                            }`}
                                        placeholder="비밀번호를 다시 입력하세요"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleResetPassword}
                                disabled={isLoading}
                                className={`w-full py-4 px-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg ${isLoading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed transform-none'
                                        : 'bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        변경 중...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        비밀번호 변경하기 🍓
                                    </div>
                                )}
                            </button>
                        </div>
                    )}
                    {
                        step === 3 && (
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">이메일이 전송되었습니다!</h3>
                                    <p className="text-gray-600 mb-4">
                                        <strong>{formData.email}</strong>로<br />
                                        비밀번호 재설정 링크를 보내드렸습니다.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        이메일이 도착하지 않았다면 스팸함을 확인해주세요.<br />
                                        링크는 1시간 후 만료됩니다.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full py-3 px-4 rounded-2xl font-medium text-pink-500 border border-pink-200 hover:bg-pink-50 transition-all"
                                >
                                    다시 시도하기
                                </button>
                            </div>
                        )
                    }

                    {/* Divider */}
                    {
                        (step === 1 || step === 2) && (
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
                        )
                    }

                    {/* Back to Login */}
                    {
                        (step === 1 || step === 2) && (
                            <div className="text-center">
                                <p className="text-gray-600">
                                    비밀번호가 기억나셨나요?{' '}
                                    <button
                                        onClick={() => window.location.href = '/login'}
                                        className="text-pink-500 hover:text-pink-600 font-medium transition-colors"
                                    >
                                        로그인하기
                                    </button>
                                </p>
                            </div>
                        )
                    }
                </div >

                {/* Back to Home */}
                < div className="text-center mt-6" >
                    <button
                        onClick={() => window.location.href = '/'}
                        className="inline-flex items-center text-pink-500 hover:text-pink-600 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        메인으로 돌아가기
                    </button>
                </div >
            </div >
        </div >
    );
};

export default PasswordResetPage;