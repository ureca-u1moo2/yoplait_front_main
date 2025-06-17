// src/pages/PlanDetailPage.js 요금제 상세페에지
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Phone, MessageSquare, Gift, Star, Users, Wifi } from 'lucide-react';
import PlanReviewSection from '../components/PlanReviewSection';
import 'styles/PlanDetailPage.css'; // CSS 파일 import

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const pinkIconStyle = {
  color: '#ec4899',
  background: 'linear-gradient(135deg, #fce7f3, #f9a8d4)',
  padding: '8px',
  borderRadius: '10px',
  boxShadow: '0 2px 6px rgba(236, 72, 153, 0.2)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '8px'
};

function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const token = localStorage.getItem('accessToken');
  // const userId = localStorage.getItem('userId');
  const userInfoRaw = localStorage.getItem('userInfo');
  const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
  const userId = userInfo?.id;
  const [reviews, setReviews] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [error, setError] = useState(null);

    // GB 파싱
  const formatDataAmount = (amount) => {
    if (amount === -1) return "무제한";
    if (amount >= 1024) return `${Math.floor(amount / 1024)}GB`;
    return `${amount}MB`;
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/plans/${id}`)
      .then(res => res.json())
      .then(data => setPlan(data.data));

    if (token) {
      fetch(`${API_BASE_URL}/api/lines/discounted-price?planId=${id}`, {
        headers: {
            'X-AUTH-TOKEN': token
        }
      })
        .then(res => res.json())
        .then(data => setDiscountedPrice(data.data));
    }
    
    fetch(`${API_BASE_URL}/api/plans/${id}/reviews`, {
        headers: token ? { 'X-AUTH-TOKEN': token } : {}
    })
        .then(res => res.json())
        .then(data => setReviews(data.data));
  }, [id, token]);

  // 요금제 리뷰 요약 불러오기
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/plans/${id}/reviews/summary`)
      .then(res => res.json())
      .then(data => setAiSummary(data.data.summary))
      .catch(() => setAiSummary('AI 요약을 불러오는 데 실패했습니다.'));
  }, [id]);

    if (error) return <div className="error">{error}</div>;
    if (!plan) return <div>Loading...</div>;

  const handleSubscribe = () => {
    fetch(`${API_BASE_URL}/api/lines/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-TOKEN': token
      },
      body: JSON.stringify({
        planId: id,
        phoneNumber,
        discountedPrice
      })
    })
        .then(res => {
    if (!res.ok) throw new Error('서버 응답 오류');
    return res.json();
  })
  .then(() => alert('가입 완료!'))
  .catch(err => {
    alert('가입 실패: ' + err.message);
  });
  };

  if (!plan) {
    return (
      <div className="plan-detail-container">
        <div className="maid-loading">💕 요금제 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="plan-detail-container">
      {/* 장식용 배경 요소들 */}
      <div className="maid-decoration-detail-1">🎀</div>
      <div className="maid-decoration-detail-2">💖</div>
      <div className="maid-decoration-detail-3">🌺</div>

      {/* 뒤로가기 버튼 */}
      <button 
        className="maid-back-btn"
        onClick={() => navigate('/plans')}
      >
        <ArrowLeft size={20} />
        요금제 목록으로
      </button>

      {/* 메인 요금제 카드 */}
      <div className="maid-plan-main-card">
        <h1 className="maid-plan-main-title">
          {plan.name}
        </h1>

        {/* 가격 정보 */}
        <div className="maid-price-highlight">
          <div className="maid-price-main">
            {plan.price.toLocaleString()}원
          </div><br />
          {token && discountedPrice && (
            <div className="maid-price-discount">
              멤버십 할인가: {discountedPrice.toLocaleString()}원
            </div>
          )}
        </div>

        {/* 요금제 설명 추가 */}
        {plan.description && (
          <p className="maid-plan-description">
            {plan.description}
          </p>
        )}

        {/* 요금제 정보 그리드 */}
        <div className="maid-plan-info-grid">
          <div className="maid-info-card">
            <div className="maid-info-label">
              <span style={pinkIconStyle}>
                <Smartphone size={18} />
              </span>
              데이터
            </div>
            <div className="maid-info-value">
              {/* {plan.dataAmount === -1 ? '무제한' : `${plan.dataAmount}MB`} */}
              {formatDataAmount(plan.dataAmount)}
            </div>
          </div>

          <div className="maid-info-card">
            <div className="maid-info-label">
              <span style={pinkIconStyle}>
                <Phone size={18} />
              </span>
              통화
            </div>
            <div className="maid-info-value">
              {plan.callAmount === -1 ? '무제한' : `${plan.callAmount}분`}
            </div>
          </div>

          <div className="maid-info-card">
            <div className="maid-info-label">
              <span style={pinkIconStyle}>
                <MessageSquare size={18} />
              </span>
              문자
            </div>
            <div className="maid-info-value">
              {plan.smsAmount === -1 ? '무제한' : `${plan.smsAmount}건`}
            </div>
          </div>

          {plan.specialFeatures && (
            <div className="maid-info-card">
              <div className="maid-info-label">
                <span style={pinkIconStyle}>
                  <Gift size={18} />
                </span>
                특별혜택
              </div>
              <div className="maid-info-value">
                {plan.specialFeatures}
              </div>
            </div>
          )}

          {plan.carrier && (
            <div className="maid-info-card">
              <div className="maid-info-label">
                <span style={pinkIconStyle}>
                  <Wifi size={18} />
                </span>
                통신사
              </div>
              <div className="maid-info-value">
                {plan.carrier}
                {plan.networkType && ` ${plan.networkType}`}
              </div>
            </div>
          )}

          {plan.popularity && (
            <div className="maid-info-card">
              <div className="maid-info-label">
                <span style={pinkIconStyle}>
                  <Users size={18} />
                </span>
                인기도
              </div>
              <div className="maid-info-value">
                {plan.popularity}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 가입 섹션 */}
      <div className="maid-subscribe-section">
        <h3 className="maid-subscribe-title">
          요금제 가입하기
        </h3>
        
        <input 
          className="maid-phone-input"
          placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
        />
        
        <button 
          className="maid-subscribe-btn"
          onClick={handleSubscribe}
        >
          지금 가입하기
        </button>

        {!token && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '1rem', 
            color: '#be185d',
            fontSize: '0.9rem',
            fontStyle: 'italic'
          }}>
            💡 로그인하시면 멤버십 할인 혜택을 받으실 수 있어요!
          </div>
        )}
      </div>

      {/* ai 리뷰 요약 섹션 */}
      {aiSummary && (
        <div className="ai-summary-box">
          <h3 className="ai-title">💡 AI 요금제 리뷰 요약</h3>
          <pre className="ai-summary-text">{aiSummary}</pre>
        </div>
      )}


      {/* 리뷰 섹션 */}
      <div className="maid-review-section">
        <h3 className="maid-review-title">
          요금제 리뷰
        </h3>
        
        <PlanReviewSection
          planId={id}
          reviews={reviews}
          userId={userId}
          token={token}
          onReload={() => window.location.reload()}
        />
      </div>
    </div>
  );
}

export default PlanDetailPage;