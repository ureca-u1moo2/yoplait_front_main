import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'styles/MyPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const getToken = () => localStorage.getItem('accessToken');

const UserInfoSection = () => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/users/me`, {
      headers: {
        'X-AUTH-TOKEN': getToken()
      }
    })
    .then((res) => {
      if (res.data.result === 'SUCCESS') {
        setUserInfo(res.data.data);
      }
    })
    .catch((err) => {
      console.error('회원 정보 조회 실패:', err);
    });
  }, []);

  if (!userInfo) return <p>💫 회원 정보를 불러오는 중입니다...</p>;

  return (
    <div className="plan-group" style={{ marginTop: '3rem' }}>
      <h3 className="plan-group-title"> 내 정보 </h3>
      <div className="mypage-user-info">
        <p><strong>이름:</strong> {userInfo.name}</p>
        <p><strong>이메일:</strong> {userInfo.email}</p>
        <p><strong>성별:</strong> {userInfo.gender}</p>
        <p><strong>생년월일:</strong> {userInfo.birth}</p>
        <p><strong>멤버십 등급:</strong> {userInfo.membershipName}</p>
      </div>
    </div>
  );
};

export default UserInfoSection;
