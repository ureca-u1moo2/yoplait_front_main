import React, { useState, useEffect } from 'react';
import { Smartphone, DollarSign, Users, User, LogOut, CheckCircle, X, AlertCircle, MessageCircle } from 'lucide-react';
import { userManager, handleLogout } from '../auth';
import { useNavigate } from 'react-router-dom';

const TelecomMainPage = () => {
  const [selectedUsage, setSelectedUsage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // API 연동을 위한 새로운 상태들
  const [popularPlans, setPopularPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const navigate = useNavigate(); 

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

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      try {
        const loggedIn = userManager.isLoggedIn();
        const user = userManager.getUserInfo();
        
        setIsLoggedIn(loggedIn);
        setUserInfo(user);
      } catch (error) {
        console.error('로그인 상태 확인 중 오류:', error);
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkLoginStatus();
    
    // 페이지 포커스 시 로그인 상태 재확인 (다른 탭에서 로그인/로그아웃한 경우)
    const handleFocus = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 인기 요금제 데이터 로드 - API 연동
  useEffect(() => {
    const fetchPopularPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
        
        const response = await fetch(`${API_BASE_URL}/api/plans?sortBy=popular`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.result === 'SUCCESS' && data.data) {
            const originalPlans = data.data.slice(0, 3);
            const reorderedPlans = originalPlans.length >= 2 ? 
              [originalPlans[1], originalPlans[0], originalPlans[2]].filter(Boolean) : 
              originalPlans;
            
            const transformedPlans = reorderedPlans.map((plan, index) => ({
              id: plan.id,
              name: plan.name,
              price: `${plan.price.toLocaleString()}원`,
              data: formatDataAmount(plan.dataAmount),
              voice: formatCallAmount(plan.callAmount),
              message: formatSmsAmount(plan.smsAmount),
              description: plan.description,
              popular: index === 1,
              emoji: getEmoji(index),
              company: "LG U+",
              createdAt: plan.createdAt,
              tags: plan.tags || [] // 태그 정보 추가
            }));
            
            setPopularPlans(transformedPlans);
          } else {
            console.error('API 응답 형식 오류:', data);
            setPopularPlans(getDefaultPlans()); // 기본 데이터 사용
          }
        } else {
          console.error('API 요청 실패:', response.status);
          setPopularPlans(getDefaultPlans()); // 기본 데이터 사용
        }
      } catch (error) {
        console.error('요금제 데이터 로드 실패:', error);
        setPopularPlans(getDefaultPlans()); // 기본 데이터 사용
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPopularPlans();
  }, []);

  // 사용자 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
    showNotification('success', '로그아웃되었습니다.');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleAuthButtonClick = () => {
    if (isLoggedIn) {
      setShowUserMenu(!showUserMenu);
    } else {
      window.location.href = '/login';
    }
  };

  const handlePlanRecommendation = () => {
    if (!isLoggedIn) {
      // 로그인이 필요한 경우 현재 페이지를 저장하고 로그인 페이지로
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      showNotification('info', '로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      // 선택된 사용 유형에 따라 챗봇으로 이동
      let message = '';
      if (selectedUsage === 'light') {
        message = '라이트 사용자에게 맞는 요금제를 추천해주세요. 주로 전화와 문자를 많이 사용하고, 데이터 사용량은 적은 편입니다.';
      } else if (selectedUsage === 'heavy') {
        message = '헤비 사용자에게 맞는 요금제를 추천해주세요. 영상 시청, 게임, SNS 등으로 데이터를 많이 사용합니다.';
      } else {
        message = '요금제 추천을 받고 싶어요. 제게 맞는 요금제를 찾아주세요.';
      }
      
      // 메시지를 URL 파라미터로 전달하여 챗봇 페이지로 이동
      const encodedMessage = encodeURIComponent(message);
      window.location.href = `/chatbot?message=${encodedMessage}`;
    }
  };

  const handleNavClick = (feature) => {
      if (feature === '요금제 목록') {
        navigate('/plans');
      } else if (feature === 'FAQ') {
        navigate('/faq');
      } else {
        showNotification('info', `${feature} 페이지 준비 중입니다.`);
      }
  };

  const handleMenuClick = (menu) => {
      if (menu === '내 요금제 현황') {
        navigate('/mypage');
      } else {
        showNotification('info', `${menu} 페이지 준비 중입니다.`);
      }
  };

  // 챗봇 클릭 핸들러 - 로그인 체크 추가
  const handleChatbotClick = () => {
    if (!isLoggedIn) {
      // 로그인이 필요한 경우
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      showNotification('info', '챗봇 서비스는 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      // 로그인된 경우 챗봇 페이지로
      window.location.href = `/chatbot`;
    }
  };

  // 데이터 변환 함수들 (-1일 때 무제한 처리)
  const formatDataAmount = (dataAmount) => {
    if (!dataAmount || dataAmount === -1 || dataAmount === 999999999) return "무제한";
    if (dataAmount >= 1024) {
      return `${Math.floor(dataAmount / 1024)}GB`;
    }
    return `${dataAmount}MB`;
  };

  const formatCallAmount = (callAmount) => {
    if (!callAmount || callAmount === -1 || callAmount === 999999999) return "무제한";
    return `${callAmount}분`;
  };

  const formatSmsAmount = (smsAmount) => {
    if (!smsAmount || smsAmount === -1 || smsAmount === 999999999) return "무제한";
    return `${smsAmount}건`;
  };

  const getEmoji = (index) => {
    const emojis = ["🥛", "🍓", "👑", "💎", "🌟"];
    return emojis[index] || "📱";
  };

  // 기본 요금제 데이터 (API 실패 시 폴백) - 2, 1, 3 순서
  const getDefaultPlans = () => [
    {
      id: "fallback-2", 
      name: "LG U+ 5GX 레귤러",
      price: "45,000원",
      data: "12GB + 매일 300MB",
      voice: "무제한",
      message: "무제한",
      popular: true, // 첫 번째가 인기 요금제
      emoji: "🍓",
      company: "LG U+",
      description: "인기 요금제",
      tags: [
        { id: "tag3", tagName: "5G" },
        { id: "tag4", tagName: "대용량" }
      ]
    },
    {
      id: "fallback-1",
      name: "LG U+ 슬림",
      price: "25,000원",
      data: "3GB + 매일 1GB",
      voice: "무제한",
      message: "무제한",
      popular: false,
      emoji: "🥛",
      company: "LG U+",
      description: "기본 요금제",
      tags: [
        { id: "tag1", tagName: "5G" },
        { id: "tag2", tagName: "경제형" }
      ]
    },
    {
      id: "fallback-3",
      name: "LG U+ 프리미엄",
      price: "65,000원",
      data: "100GB",
      voice: "무제한", 
      message: "무제한",
      popular: false,
      emoji: "👑",
      company: "LG U+",
      description: "프리미엄 요금제",
      tags: [
        { id: "tag5", tagName: "프리미엄" },
        { id: "tag6", tagName: "대용량" },
        { id: "tag7", tagName: "5G" }
      ]
    }
  ];

  const handlePlanDetail = (planId) => {
    // 새창으로 요금제 상세 페이지 이동
    window.location.href = `/plans/${planId}`;
  };

  const features = [
    {
      icon: <Smartphone className="w-8 h-8 text-pink-500" />,
      title: "AI 맞춤 요금제 추천",
      description: "사용 패턴을 분석하여 가장 적합한 요금제를 추천해드립니다."
    },
    {
      icon: <Users className="w-8 h-8 text-pink-400" />,
      title: "개인 맞춤 추천",
      description: "개인 데이터를 기반으로 맞춤 요금제를 추천받을 수 있습니다."
    },
    {
      icon: <DollarSign className="w-8 h-8 text-rose-500" />,
      title: "요금제 비교",
      description: "다양한 요금제를 비교하여 최적의 선택을 도와드립니다."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-25 to-red-50">
      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
              onClick={cancelLogout}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-pink-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-pink-100 sm:mx-0 sm:h-10 sm:w-10">
                    <span className="text-2xl">🥺</span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      로그아웃
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        정말 로그아웃하시겠습니까?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="w-full inline-flex justify-center rounded-2xl border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-red-400 to-pink-500 text-base font-medium text-white hover:from-red-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                >
                  로그아웃
                </button>
                <button
                  type="button"
                  onClick={cancelLogout}
                  className="mt-3 w-full inline-flex justify-center rounded-2xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-pink-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">🍓</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                요플레
              </span>
              <span className="text-sm text-pink-400 ml-2">요금 플래너</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <button 
                onClick={() => handleNavClick('요금제 목록')}
                className="text-gray-700 hover:text-pink-500 transition-colors font-medium"
              >
                요금제 목록
              </button>
              <button 
                onClick={() => handleNavClick('FAQ')}
                className="text-gray-700 hover:text-pink-500 transition-colors font-medium"
              >
                FAQ
              </button>
            </div>
            
            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="relative user-menu-container">
                  <button
                    onClick={handleAuthButtonClick}
                    className="flex items-center space-x-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white px-4 py-2 rounded-full hover:from-pink-500 hover:to-rose-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                      {userInfo?.name || userInfo?.email?.split('@')[0] || '사용자'}님
                    </span>
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-pink-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-pink-100">
                        <p className="text-sm font-medium text-gray-900">
                          {userInfo?.name || '사용자'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {userInfo?.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => handleMenuClick('내 요금제 현황')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                        >
                          <Smartphone className="w-4 h-4 mr-3" />
                          내 요금제 현황
                        </button>
 
                        <div className="border-t border-pink-100 my-1"></div>
                        <button
                          onClick={handleLogoutClick}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          로그아웃
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="text-gray-700 hover:text-pink-500 transition-colors font-medium"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => window.location.href = '/signup'}
                    className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-6 py-2 rounded-full hover:from-pink-500 hover:to-rose-600 transition-all transform hover:scale-105 shadow-lg font-medium"
                  >
                    회원가입
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <span className="text-6xl">🍦</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {isLoggedIn ? (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                    {userInfo?.name || '회원'}님
                  </span>
                  의 요금제 추천
                </>
              ) : (
                <>
                  맞춤 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                    {" "}요금제{" "}
                  </span>
                  추천
                </>
              )}
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              {isLoggedIn ? (
                "개인 맞춤형 요금제 추천으로 최적의 절약을 경험해보세요"
              ) : (
                <>
                  AI가 분석하는 개인 맞춤형 요금제 추천 서비스<br/>
                  복잡한 요금제 비교는 이제 그만, 최적의 요금제를 찾아보세요
                </>
              )}
            </p>
            
            {/* Quick Survey */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto mb-12 border border-pink-100">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                {isLoggedIn ? '맞춤 요금제 추천' : '요금제 진단'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setSelectedUsage('light')}
                  disabled={!isLoggedIn}
                  className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                    selectedUsage === 'light' 
                      ? 'border-pink-400 bg-pink-50 text-pink-700 shadow-lg' 
                      : 'border-pink-200 hover:border-pink-300 bg-white/50'
                  } ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-3xl mb-3 block">🥛</span>
                  <div className="font-semibold">라이트 사용자</div>
                  <div className="text-sm text-gray-500">전화, 문자 위주</div>
                </button>
                <button
                  onClick={() => setSelectedUsage('heavy')}
                  disabled={!isLoggedIn}
                  className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                    selectedUsage === 'heavy' 
                      ? 'border-pink-400 bg-pink-50 text-pink-700 shadow-lg' 
                      : 'border-pink-200 hover:border-pink-300 bg-white/50'
                  } ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-3xl mb-3 block">🍓</span>
                  <div className="font-semibold">헤비 사용자</div>
                  <div className="text-sm text-gray-500">영상, 게임, SNS</div>
                </button>
              </div>
              <button 
                onClick={handlePlanRecommendation}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white py-4 rounded-2xl font-semibold text-lg hover:from-pink-500 hover:to-rose-600 transition-all transform hover:scale-105 shadow-lg"
              >
                {isLoggedIn ? '나에게 맞는 요금제 찾기' : '로그인 후 이용하기'}
              </button>
              
              {!isLoggedIn && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  정확한 개인 맞춤 추천을 위해 로그인이 필요합니다.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-pink-200 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-rose-200 rounded-full opacity-30 animate-pulse delay-75"></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 bg-pink-300 rounded-full opacity-30 animate-bounce delay-150"></div>
        <div className="absolute top-60 right-10 text-4xl animate-pulse">🍓</div>
        <div className="absolute bottom-40 left-40 text-3xl animate-bounce">🥛</div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">왜 요플레일까요?</h2>
            <p className="text-xl text-gray-600">AI 데이터 분석으로 최적의 선택을 도와드려요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 border border-pink-100">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Plans Section - API 연동된 부분 */}
      <section className="py-20 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">인기 요금제</h2>
            <p className="text-xl text-gray-600">많은 사용자들이 선택한 추천 요금제</p>
          </div>
          
          {/* 로딩 상태 또는 요금제 카드들 */}
          {isLoadingPlans ? (
            // 로딩 상태
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">인기 요금제를 불러오는 중...</p>
              </div>
            </div>
          ) : (
            // 요금제 카드들
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {popularPlans.map((plan, index) => (
                <div 
                  key={plan.id || index}
                  className={`bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl relative border-2 transition-all cursor-pointer hover:shadow-2xl ${
                    plan.popular 
                      ? 'border-pink-400 transform scale-105 shadow-2xl' 
                      : 'border-pink-100 hover:border-pink-300 hover:transform hover:scale-102'
                  }`}
                  onClick={() => handlePlanDetail(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-pink-400 to-rose-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        추천
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-4xl mb-3">{plan.emoji}</div>
                    <div className="text-xs font-medium text-gray-500 mb-1">{plan.company}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    
                    {/* 태그 표시 영역 */}
                    {plan.tags && plan.tags.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mb-3">
                        {plan.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span 
                            key={tag.id || tagIndex}
                            className="text-xs px-2 py-1 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-600 rounded-full border border-pink-200"
                          >
                            {tag.tagName}
                          </span>
                        ))}
                        {plan.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{plan.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-6">
                      {plan.price}<span className="text-lg text-gray-500">/월</span>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center bg-pink-50 rounded-2xl p-3">
                        <span className="text-gray-600">📱 데이터</span>
                        <span className="font-semibold text-pink-600">{plan.data}</span>
                      </div>
                      <div className="flex justify-between items-center bg-rose-50 rounded-2xl p-3">
                        <span className="text-gray-600">📞 음성통화</span>
                        <span className="font-semibold text-rose-600">{plan.voice}</span>
                      </div>
                      <div className="flex justify-between items-center bg-pink-50 rounded-2xl p-3">
                        <span className="text-gray-600">💌 문자메시지</span>
                        <span className="font-semibold text-pink-600">{plan.message}</span>
                      </div>
                    </div>

                    {plan.description && (
                      <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded-xl">
                        {plan.description}
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/plans/${plan.id}`;
                      }}
                      className={`w-full py-4 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600 shadow-lg' 
                          : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                      }`}
                    >
                      자세히 보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="text-5xl mb-6">🍦</div>
          <h2 className="text-4xl font-bold text-white mb-6">
            {isLoggedIn ? '더 많은 절약을 시작하세요!' : '지금 바로 시작해보세요!'}
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            {isLoggedIn 
              ? '개인 맞춤 요금제로 월 평균 2만원 이상 절약하세요 💰'
              : '개인 맞춤 요금제로 더 많이 절약할 수 있어요 💰'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <>
                <button 
                  onClick={handleChatbotClick}
                  className="bg-white text-pink-500 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-pink-50 transition-all transform hover:scale-105 shadow-lg"
                >
                  AI 챗봇 상담하기
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => window.location.href = '/signup'}
                  className="bg-white text-pink-500 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-pink-50 transition-all transform hover:scale-105 shadow-lg"
                >
                  무료 회원가입 시작
                </button>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-pink-500 transition-all transform hover:scale-105"
                >
                  로그인하기
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer - 서비스만 간단하게 */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">🍓</span>
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">요플레</span>
                  <div className="text-sm text-gray-400">요금 플래너</div>
                </div>
              </div>
              <p className="text-gray-400">
                요금제 선택의 새로운 기준
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-pink-300">서비스</h4>
              <div className="space-y-2 text-gray-400">
                <button 
                  onClick={() => handleNavClick('요금제 목록')}
                  className="block hover:text-pink-300 transition-colors cursor-pointer text-left"
                >
                  요금제 목록
                </button>
                <button 
                  onClick={() => handleNavClick('FAQ')}
                  className="block hover:text-pink-300 transition-colors cursor-pointer text-left"
                >
                  FAQ
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 요플레 : 스마트한 요금제 선택의 파트너</p>
          </div>
        </div>
      </footer>

      {/* 챗봇 아이콘 - 우측 하단 고정 (로그인 체크 추가) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={handleChatbotClick}
          className={`w-16 h-16 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 flex items-center justify-center group relative ${
            !isLoggedIn ? 'opacity-75' : ''
          }`}
        >
          <MessageCircle className="w-7 h-7 text-white group-hover:animate-pulse" />
          {!isLoggedIn && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
        </button>
        {/* 툴팁 */}
        <div className="absolute bottom-20 right-0 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {isLoggedIn ? 'AI 챗봇 문의' : '로그인 후 이용 가능'}
        </div>
      </div>
    </div>
  );
};

export default TelecomMainPage;