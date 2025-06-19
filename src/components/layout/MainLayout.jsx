import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { User, LogOut, Smartphone, MessageCircle, CheckCircle, X, AlertCircle } from 'lucide-react';
import { userManager, handleLogout } from '../../auth';

const MainLayout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const user = userManager.getUserInfo();
    setIsLoggedIn(!!user);
    setUserInfo(user);
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleLogoutClick = () => {
      setShowLogoutConfirm(true);
    // handleLogout();
    // setIsLoggedIn(false);
    // setShowUserMenu(false);
    // showNotification('success', '로그아웃되었습니다.');
    // navigate('/login');
  };

  const confirmLogout = () => {
  setShowLogoutConfirm(false);
  handleLogout();
  setIsLoggedIn(false);
  setShowUserMenu(false);
  showNotification('success', '로그아웃되었습니다.');
  navigate('/login');
};

const cancelLogout = () => {
  setShowLogoutConfirm(false);
};


  const handleAuthButtonClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuClick = (menu) => {
    setShowUserMenu(false);
    if (menu === '내 요금제 현황') navigate('/mypage');
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <div className="relative min-h-screen bg-white">
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
              onClick={cancelLogout}
            ></div>
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

      {/* Notification */}
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
              <button onClick={closeNotification} className="ml-4 text-gray-400 hover:text-gray-600">
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
            {/* 로고 */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mr-3">
                {/* <span className="text-white font-bold text-lg">🍓</span> */}
                {/* 로고 이미지로 교체 */}
                <img 
                  src="/assets/Yoplait.png" // 👉 여기에 실제 이미지 경로
                  alt="로고"
                  className="w-10 h-10 rounded-full object-cover mr-3 shadow-sm"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                요플레
              </span>
              <span className="text-sm text-pink-400 ml-2">요금 플래너</span>
            </div>

            {/* 메뉴 */}
            <div className="hidden md:flex space-x-8">
              <button 
                onClick={() => navigate('/plans')}
                className="text-gray-700 hover:text-pink-500 transition-colors font-medium"
              >
                요금제 목록
              </button>
              <button 
                onClick={() => navigate('/faq')}
                className="text-gray-700 hover:text-pink-500 transition-colors font-medium"
              >
                FAQ
              </button>
            </div>

            {/* 로그인/유저 메뉴 */}
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
                    onClick={() => navigate('/login')}
                    className="text-gray-700 hover:text-pink-500 transition-colors font-medium"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
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

      {/* 본문 영역 */}
      <main className="pt-8 pb-20 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* 챗봇 버튼 */}
      {window.location.pathname !== '/chatbot' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => navigate('/chatbot')}
            className="w-16 h-16 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 flex items-center justify-center group"
          >
            <MessageCircle className="w-7 h-7 text-white group-hover:animate-pulse" />
          </button>
          <div className="absolute bottom-20 right-0 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI 챗봇 문의
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
