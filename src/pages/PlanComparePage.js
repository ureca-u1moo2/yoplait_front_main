//요금제 비교페이지

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Smartphone, Phone, MessageSquare, Gift, User, ArrowLeft, Plus } from 'lucide-react';
import 'styles/PlanComparePage.css'; // CSS 파일 import

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const pinkIconStyle = {
  color: '#ec4899',
  background: 'linear-gradient(135deg, #fce7f3, #f9a8d4)',
  padding: '8px',
  borderRadius: '10px',
  boxShadow: '0 2px 6px rgba(236, 72, 153, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '40px',
  height: '40px'
};

function PlanComparePage() {
  const [plans, setPlans] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [selectedUserPlan, setSelectedUserPlan] = useState('');
  const [userPlanIds, setUserPlanIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const accessToken = localStorage.getItem("accessToken");

  // GB 파싱
  const formatDataAmount = (amount) => {
    if (amount === -1) return "무제한";
    if (amount >= 1024) return `${Math.floor(amount / 1024)}GB`;
    return `${amount}MB`;
  };


  // 비교할 요금제 가져오기
  useEffect(() => {
    const ids = params.get('ids');
    if (ids) {
      setIsLoading(true);
      fetch(`${API_BASE_URL}/api/plans/compare?planIds=${ids}`)
        .then(res => res.json())
        .then(data => {
          setPlans(data.data || []);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch compare plans:', err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [params]);

  // 로그인 사용자일 경우 내 요금제 불러오기
  useEffect(() => {
    if (!accessToken) return;
    fetch(`${API_BASE_URL}/api/user-plans`, {
      headers: { "X-AUTH-TOKEN": accessToken }
    })
      .then(res => res.json())
      .then(data => {
        if (data.result === 'SUCCESS') {
          setUserPlans(data.data || []);
          setUserPlanIds((data.data || []).map(plan => plan.planId));
        }
      })
      .catch(err => {
        console.error('Failed to fetch user plans:', err);
      });
  }, [accessToken]);

  // 드롭다운 선택 후 비교에 추가
  const handleAddUserPlan = () => {
    if (!selectedUserPlan) {
      alert("요금제를 선택해주세요 💕");
      return;
    }
    
    const currentParams = params.get('ids');
    const existingIds = currentParams ? currentParams.split(',') : [];

    if (existingIds.includes(selectedUserPlan)) {
      alert("이미 비교 목록에 추가된 요금제에요! 💖");
      return;
    }

    const newIds = [...existingIds, selectedUserPlan].join(',');
    navigate(`/plans/compare?ids=${newIds}`);
    setSelectedUserPlan('');
  };

  const handleBackToList = () => {
    navigate('/plans');
  };

  if (isLoading) {
    return (
      <div className="compare-page-container">
        <div className="maid-loading">💕 요금제 비교 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="compare-page-container">
      {/* 장식용 배경 요소들 */}
      <div className="compare-decoration-1">🎀</div>
      <div className="compare-decoration-2">💖</div>
      <div className="compare-decoration-3">🌺</div>

      {/* 페이지 헤더 */}
      <div className="compare-page-header">
        <h1 className="compare-page-title">요금제 비교</h1>
        <p className="compare-page-subtitle">
          선택하신 요금제들을 꼼꼼히 비교해보고 가장 달콤한 선택을 해보세요 ♡
        </p>
      </div>

      {/* 뒤로가기 버튼 */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="maid-back-btn" onClick={handleBackToList}>
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
          요금제 목록으로 돌아가기
        </button>
      </div>

      {/* 로그인 사용자만 보이는 내 요금제 추가 영역 */}
      {accessToken && userPlans.length > 0 && (
        <div className="maid-user-plan-card">
          <div className="user-plan-header">
            <User style={pinkIconStyle} size={20} />
            내 가입 요금제를 비교에 추가해보세요!
          </div>
          <div className="user-plan-controls">
            <select
              className="maid-user-select"
              value={selectedUserPlan}
              onChange={(e) => setSelectedUserPlan(e.target.value)}
            >
              <option value="">-- 내 요금제 선택하기 --</option>
              {userPlans.map(plan => (
                <option key={plan.planId} value={plan.planId}>
                  {plan.name} ({plan.phoneNumber})
                </option>
              ))}
            </select>
            <button 
              className="maid-add-btn"
              onClick={handleAddUserPlan} 
              disabled={!selectedUserPlan}
            >
              비교에 추가하기
            </button>
          </div>
        </div>
      )}

      {/* 비교 결과 */}
      {plans.length === 0 ? (
        <div className="compare-grid">
          <div className="maid-compare-empty">
            <div className="compare-empty-icon">💔</div>
            <div className="compare-empty-text">비교할 요금제가 없어요</div>
            <p className="compare-empty-subtitle">
              요금제 목록에서 비교하고 싶은 요금제를 선택해주세요!
            </p>
            <button className="maid-back-btn" onClick={handleBackToList}>
              요금제 목록 보기
            </button>
          </div>
        </div>
      ) : (
        <div className="compare-grid">
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className={`maid-compare-card ${userPlanIds.includes(plan.id) ? 'is-my-plan' : ''}`}
              onClick={() => navigate(`/plans/${plan.id}`)}
            >
              {/* 요금제 헤더 */}
              <div className="compare-card-header">
                <h3 className="compare-plan-name">
                  {plan.name}
                </h3>
                <div className="compare-price-tag">
                  {plan.price.toLocaleString()}원
                </div>
              </div>

              {/* 요금제 상세 정보 */}
              <div className="compare-plan-info">
                <div className="compare-info-item">
                  <div className="compare-info-icon">
                    <Smartphone size={20} />
                  </div>
                  <div className="compare-info-content">
                    <div className="compare-info-label">데이터</div>
                    <div className="compare-info-value">
                      {/* {plan.dataAmount === -1 ? '무제한' : `${plan.dataAmount}MB`} */}
                      {formatDataAmount(plan.dataAmount)}
                    </div>
                  </div>
                </div>

                <div className="compare-info-item">
                  <div className="compare-info-icon">
                    <Phone size={20} />
                  </div>
                  <div className="compare-info-content">
                    <div className="compare-info-label">통화</div>
                    <div className="compare-info-value">
                       {plan.callAmount === -1 ? '무제한' : `${plan.callAmount}분`}
                    </div>
                  </div>
                </div>

                <div className="compare-info-item">
                  <div className="compare-info-icon">
                    <MessageSquare size={20} />
                  </div>
                  <div className="compare-info-content">
                    <div className="compare-info-label">문자</div>
                    <div className="compare-info-value">
                      {plan.smsAmount === -1 ? '무제한' : `${plan.smsAmount}건`}
                    </div>
                  </div>
                </div>

                {plan.specialFeatures && (
                  <div className="compare-info-item">
                    <div className="compare-info-icon">
                      <Gift size={20} />
                    </div>
                    <div className="compare-info-content">
                      <div className="compare-info-label">특별혜택</div>
                      <div className="compare-info-value">
                        {plan.specialFeatures}
                      </div>
                    </div>
                  </div>
                )}

                {/* 통신사 정보 */}
                {plan.carrier && (
                  <div className="compare-info-item">
                    <div className="compare-info-icon">
                      <span style={{ fontSize: '1.2rem' }}>📡</span>
                    </div>
                    <div className="compare-info-content">
                      <div className="compare-info-label">통신사</div>
                      <div className="compare-info-value">
                        {plan.carrier}
                        {plan.networkType && ` • ${plan.networkType}`}
                        {plan.popularity && ` • 인기도 ${plan.popularity}%`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 비교 결과 요약 */}
      {plans.length > 0 && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '3rem', 
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(252, 231, 243, 0.6))',
          borderRadius: '15px',
          border: '1px solid rgba(244, 114, 182, 0.2)',
          color: '#be185d',
          fontWeight: '500'
        }}>
          <p style={{ margin: '0' }}>
            총 {plans.length}개의 요금제를 비고하고 있어요 ✨
            <br />
            각 카드를 클릭하면 상세 정보를 볼 수 있어요!
          </p>
        </div>
      )}
    </div>
  );
}

export default PlanComparePage;