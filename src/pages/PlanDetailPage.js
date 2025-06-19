// // src/pages/PlanDetailPage.js 요금제 상세페에지

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Phone, MessageSquare, Gift, Users, Wifi } from 'lucide-react';
import PlanReviewSection from '../components/PlanReviewSection';
import { NotificationProvider, useNotification } from 'context/NotificationContext';
import 'styles/PlanDetailPage.css';

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

function PlanDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const token = localStorage.getItem('accessToken');
  const userInfoRaw = localStorage.getItem('userInfo');
  const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
  const userId = userInfo?.id;
  const [reviews, setReviews] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const formatDataAmount = (amount) => {
    if (amount === -1) return "무제한";
    if (amount >= 1024) return `${Math.floor(amount / 1024)}GB`;
    return `${amount}MB`;
  };

  const formatPhoneNumber = (value) => {
  const onlyNums = value.replace(/[^\d]/g, ''); // 숫자만 추출

  if (onlyNums.length <= 3) return onlyNums;
  if (onlyNums.length <= 7) return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
  return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`;
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

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/plans/${id}/reviews/summary`)
      .then(res => res.json())
      .then(data => setAiSummary(data.data.summary))
      .catch(() => setAiSummary('AI 요약을 불러오는 데 실패했습니다.'));
  }, [id]);

  if (error) return <div className="error">{error}</div>;
  if (!plan) return <div>Loading...</div>;

  const handleSubscribe = () => {
    if (!phoneNumber.trim()) {
      showNotification('info', '전화번호를 입력해주세요! 📱');
      return;
    }

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
      .then(() => {
        showNotification('success', '가입이 완료되었어요! 💖');
        setPhoneNumber('');
      })
      .catch(err => {
        showNotification('error', '가입 실패: 해당 번호는 이미 요금제가 있어요! ');
      });
  };

  return (
    <div className="plan-detail-container">
      <div className="maid-decoration-detail-1">🎀</div>
      <div className="maid-decoration-detail-2">💖</div>
      <div className="maid-decoration-detail-3">🌺</div>

      <button
        className="maid-back-btn"
        onClick={() => navigate('/plans')}
      >
        <ArrowLeft size={20} />
        요금제 목록으로
      </button>

      <div className="maid-plan-main-card">
        <h1 className="maid-plan-main-title">{plan.name}</h1>
        <div className="maid-price-highlight">
          <div className="maid-price-main">{plan.price.toLocaleString()}원</div><br />
          {token && discountedPrice && (
            <div className="maid-price-discount">
              멤버십 할인가: {discountedPrice.toLocaleString()}원
            </div>
          )}
        </div>

        {plan.description && (
          <p className="maid-plan-description">{plan.description}</p>
        )}

        <div className="maid-plan-info-grid">
          <div className="maid-info-card">
            <div className="maid-info-label"><span style={pinkIconStyle}><Smartphone size={18} /></span>데이터</div>
            <div className="maid-info-value">{formatDataAmount(plan.dataAmount)}</div>
          </div>
          <div className="maid-info-card">
            <div className="maid-info-label"><span style={pinkIconStyle}><Phone size={18} /></span>통화</div>
            <div className="maid-info-value">{plan.callAmount === -1 ? '무제한' : `${plan.callAmount}분`}</div>
          </div>
          <div className="maid-info-card">
            <div className="maid-info-label"><span style={pinkIconStyle}><MessageSquare size={18} /></span>문자</div>
           <div className="maid-info-value">{plan.smsAmount >= 15000 ? `기본제공` : `${plan.smsAmount}건`}</div>

          </div>
          {plan.specialFeatures && (
            <div className="maid-info-card">
              <div className="maid-info-label"><span style={pinkIconStyle}><Gift size={18} /></span>특별혜택</div>
              <div className="maid-info-value">{plan.specialFeatures}</div>
            </div>
          )}
          {plan.carrier && (
            <div className="maid-info-card">
              <div className="maid-info-label"><span style={pinkIconStyle}><Wifi size={18} /></span>통신사</div>
              <div className="maid-info-value">{plan.carrier} {plan.networkType || ''}</div>
            </div>
          )}
          {plan.popularity && (
            <div className="maid-info-card">
              <div className="maid-info-label"><span style={pinkIconStyle}><Users size={18} /></span>인기도</div>
              <div className="maid-info-value">{plan.popularity}%</div>
            </div>
          )}
        </div>
      </div>

      <div className="maid-subscribe-section">
        <h3 className="maid-subscribe-title">요금제 가입하기</h3>
        {/* <input
          className="maid-phone-input"
          placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
        /> */}
        {/* 전화번호 형식 고정 */}
        <input
          className="maid-phone-input"
          placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
          value={phoneNumber}
          onChange={e => setPhoneNumber(formatPhoneNumber(e.target.value))}
        />

        <button className="maid-subscribe-btn" onClick={handleSubscribe}>
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

      {/* {aiSummary && (
        <div className="ai-summary-box">
          <h3 className="ai-title">💡 AI 요금제 리뷰 요약</h3>
          <pre className="ai-summary-text">{aiSummary}</pre>
        </div>
      )} */}
      {aiSummary && (
  <div style={{
    marginTop: '2rem',
    marginBottom: '2rem',
    padding: '2rem',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #fef7ff 0%, #fce7f3 50%, #f9a8d4 100%)',
    border: '2px solid #f472b6',
    boxShadow: '0 8px 32px rgba(244, 114, 182, 0.15)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* 딸기 이모지 장식 */}
    <div style={{
      position: 'absolute',
      top: '-10px',
      right: '-10px',
      fontSize: '3rem',
      opacity: 0.1,
      transform: 'rotate(15deg)'
    }}>🍓</div>

    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1.5rem',
      gap: '0.75rem'
    }}>
      <span style={{
        color: '#fff',
        background: 'linear-gradient(135deg, #ec4899, #be185d)',
        padding: '10px',
        borderRadius: '10px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        💖
      </span>
      <h3 style={{
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#be185d',
        textShadow: '0 2px 4px rgba(190, 24, 93, 0.1)'
      }}>
        AI 요플레의 리뷰 요약 🍓
      </h3>
    </div>

    <div style={{
      whiteSpace: 'pre-wrap',
      color: '#831843',
      fontSize: '1.05rem',
      lineHeight: '1.6',
      fontWeight: '500',
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      padding: '1.5rem',
      borderRadius: '15px',
      border: '1px solid rgba(244, 114, 182, 0.3)'
    }}>
      {aiSummary}
    </div>
  </div>
)}


      <div className="maid-review-section">
        <h3 className="maid-review-title">요금제 리뷰</h3>
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

//  export
export default function PlanDetailPage() {
  return (
    <NotificationProvider>
      <PlanDetailContent />
    </NotificationProvider>
  );
}
