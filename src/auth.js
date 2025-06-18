// auth.js - 인증 관련 유틸리티 함수들

// 토큰 관리
export const tokenManager = {
  // 액세스 토큰 저장
  setAccessToken: (token) => {
    localStorage.setItem('accessToken', token);
  },
  
  // 리프레시 토큰 저장
  setRefreshToken: (token) => {
    localStorage.setItem('refreshToken', token);
  },
  
  // 액세스 토큰 가져오기
  getAccessToken: () => {
    return localStorage.getItem('accessToken');
  },
  
  // 리프레시 토큰 가져오기
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },
  
  // 모든 토큰 삭제
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  },
  
  // 토큰 유효성 검사
  isTokenValid: (token) => {
    if (!token) return false;
    
    try {
      // JWT 토큰 디코딩 (간단한 방법)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }
};

// 사용자 정보 관리
export const userManager = {
  // 사용자 정보 저장
  setUserInfo: (userInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  },
  
  // 사용자 정보 가져오기
  getUserInfo: () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },
  
  // 로그인 상태 확인
  isLoggedIn: () => {
    const accessToken = tokenManager.getAccessToken();
    return accessToken && tokenManager.isTokenValid(accessToken);
  }
};

// API 요청 헬퍼
export const apiClient = {
  // 인증이 필요한 API 요청
  authenticatedRequest: async (url, options = {}) => {
    const accessToken = tokenManager.getAccessToken();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'X-AUTH-TOKEN': accessToken }),
        ...options.headers
      },
      ...options
    };
    
    try {
      let response = await fetch(url, defaultOptions);
      
      // 토큰 만료시 리프레시 시도
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          defaultOptions.headers['X-AUTH-TOKEN'] = newToken;
          response = await fetch(url, defaultOptions);
        } else {
          // 리프레시 실패시 로그아웃 처리
          handleLogout();
          throw new Error('Authentication failed');
        }
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};

// 토큰 리프레시
const refreshAccessToken = async () => {
  const refreshToken = tokenManager.getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-REFRESH-TOKEN': refreshToken
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });
    
    const data = await response.json();
    
    if (data.result === 'SUCCESS' && data.data.token) {
      tokenManager.setAccessToken(data.data.token.accessToken);
      tokenManager.setRefreshToken(data.data.token.refreshToken); 
      return data.data.token.accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

// 로그아웃 처리
export const handleLogout = async () => {
  try {
    const refreshToken = tokenManager.getRefreshToken();
    
    if (refreshToken) {
      // 서버에 로그아웃 요청
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
      
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-REFRESH-TOKEN': refreshToken
        }
      });
    }
  } catch (error) {
    console.error('서버 로그아웃 요청 실패:', error);
    // 서버 요청이 실패해도 클라이언트 측 로그아웃은 진행
  } finally {
    // 클라이언트 측 토큰 삭제 및 리다이렉트
    tokenManager.clearTokens();
    window.location.href = '/login';
  }
};

// 로그인 리다이렉트 처리
export const handleLoginSuccess = (loginResponse) => {
  const { accessToken, refreshToken } = loginResponse.data.token;
  const { userDto } = loginResponse.data;
  
  // 토큰 저장
  if (accessToken) {
    tokenManager.setAccessToken(accessToken);
  }
  if (refreshToken) {
    tokenManager.setRefreshToken(refreshToken);
  }
  
  // 사용자 정보 저장 (userDto를 user 형태로 변환)
  if (userDto) {
    const userInfo = {
      id: userDto.userId,
      name: userDto.name,
      email: userDto.email,
      gender: userDto.gender,
      birth: userDto.birth,
      membership: userDto.membership
    };
    userManager.setUserInfo(userInfo);
  }
  
  // 이전 페이지로 리다이렉트 또는 메인 페이지로
  const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/';
  localStorage.removeItem('redirectAfterLogin');
  
  window.location.href = redirectUrl;
};

// 로그인이 필요한 페이지 접근시 처리
export const requireAuth = () => {
  if (!userManager.isLoggedIn()) {
    // 현재 페이지 URL을 저장하여 로그인 후 리다이렉트
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/login';
    return false;
  }
  return true;
};

// 개발/테스트용 함수들
export const authUtils = {
  // 로그인 상태 체크 (디버깅용)
  checkAuthStatus: () => {
    const accessToken = tokenManager.getAccessToken();
    const userInfo = userManager.getUserInfo();
    const isLoggedIn = userManager.isLoggedIn();
    
    console.log('=== Auth Status ===');
    console.log('Access Token:', accessToken ? '존재함' : '없음');
    console.log('User Info:', userInfo);
    console.log('Is Logged In:', isLoggedIn);
    console.log('==================');
    
    return {
      hasToken: !!accessToken,
      userInfo,
      isLoggedIn
    };
  },
  
  // 강제 로그아웃 (테스트용)
  forceLogout: () => {
    tokenManager.clearTokens();
    console.log('강제 로그아웃 완료');
  },
  
  // 가짜 로그인 (테스트용)
  mockLogin: (email = 'test@example.com', name = '테스트 사용자') => {
    // 가짜 JWT 토큰 생성 (실제로는 서버에서 받아야 함)
    const mockToken = btoa(JSON.stringify({
      sub: email,
      name: name,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1시간 후 만료
    }));
    
    const mockUserInfo = {
      email: email,
      name: name,
      id: '1',
      createdAt: new Date().toISOString()
    };
    
    tokenManager.setAccessToken(`header.${mockToken}.signature`);
    tokenManager.setRefreshToken('mock-refresh-token');
    userManager.setUserInfo(mockUserInfo);
    
    console.log('가짜 로그인 완료:', mockUserInfo);
    return mockUserInfo;
  }
};