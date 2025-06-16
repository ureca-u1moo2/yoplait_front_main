// 요금제 목록/상세/비교/마이페이지 메뉴 동일
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Smartphone, MessageCircle } from 'lucide-react';
import { userManager, handleLogout } from '../../auth';

const MainLayout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = userManager.getUserInfo();
    setIsLoggedIn(!!user);
    setUserInfo(user);
  }, []);

  const handleLogoutClick = () => {
    handleLogout();
    setIsLoggedIn(false);
    setShowUserMenu(false);
    navigate('/login');
  };

  const handleAuthButtonClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuClick = (menu) => {
    setShowUserMenu(false);
    switch (menu) {
      case '내 요금제 현황':
        navigate('/mypage');
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative min-h-screen">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-pink-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">🍓</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                요플레
              </span>
              <span className="text-sm text-pink-400 ml-2">요금 플래너</span>
            </Link>

            <div className="hidden md:flex space-x-8">
              <button 
                onClick={() => navigate('/plans')}
                className="text-gray-700 hover:text-pink-500 transition-colors font-medium"
              >
                요금제 목록
              </button>
              <button 
                onClick={() => navigate('/FAQ')}
                className="text-gray-700 hover:text-pink-500 transition-colors font-medium"
              >
                FAQ
              </button>
            </div>

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

      <main>
        <Outlet />
      </main>

      {/* 챗봇 아이콘 - 우측 하단 고정 */}
      {window.location.pathname !== '/chatbot' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => window.location.href = '/chatbot'}
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
