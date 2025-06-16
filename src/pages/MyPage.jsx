// 마이페이지 수정
import React, { useState } from 'react';
import 'styles/MyPage.css';
import PlansSection from 'pages/PlansSection';
import UsageSection from 'pages/UsageSection';

const MyPage = () => {
  const [selectedMenu, setSelectedMenu] = useState('plans');

  const menuItems = [
    { key: 'plans', label: '가입한 요금제 조회' },
    { key: 'usage', label: '월별 사용량 조회' }
  ];

  return (
    <div className="mypage-container">
      <div className="mypage-sidebar">
        {menuItems.map(item => (
          <div
            key={item.key}
            className={`mypage-menu-item ${selectedMenu === item.key ? 'active' : ''}`}
            onClick={() => setSelectedMenu(item.key)}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div className="mypage-content">
        {selectedMenu === 'plans' && <PlansSection />}
        {selectedMenu === 'usage' && <UsageSection />}
      </div>
    </div>
  );
};

export default MyPage;