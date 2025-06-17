// PlansSection.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PlanCard from '../components/PlanCard';
import DeleteConfirmModal from 'components/DeleteConfirmModal';
import { useNotification } from 'context/NotificationContext';
import 'styles/MyPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const PlansSection = () => {
  const [plans, setPlans] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [targetLineId, setTargetLineId] = useState(null);
  const { showNotification } = useNotification();

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/api/user-plans`, {
        headers: { 'X-AUTH-TOKEN': token }
      });
      setPlans(res.data.data);
    } catch (error) {
      showNotification('error', '요금제 조회 실패: ' + error.message);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCancelRequest = (lineId) => {
    setTargetLineId(lineId);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/api/lines/${targetLineId}`, {
        headers: { 'X-AUTH-TOKEN': token }
      });
      showNotification('success', '요금제가 정상적으로 해지되었습니다.');
      fetchPlans();
    } catch (err) {
      showNotification('error', '해지 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setCancelModalOpen(false);
      setTargetLineId(null);
    }
  };

  const handleReview = (plan) => {
    setReviewTarget(plan);
    setReviewContent('');
    setReviewRating(0);
    setHoverRating(0);
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewContent.trim()) return showNotification('info', '리뷰 내용을 입력해주세요.');
    if (reviewRating === 0) return showNotification('info', '별점을 선택해주세요.');

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/api/plans/${reviewTarget.planId}/reviews`, {
        content: reviewContent,
        rating: reviewRating
      }, {
        headers: { 'X-AUTH-TOKEN': token }
      });
      showNotification('success', '리뷰가 등록되었습니다.');
      setShowReviewModal(false);
    } catch (err) {
      showNotification('error', '리뷰 등록 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= (hoverRating || reviewRating);
      stars.push(
        <span
          key={i}
          className={`star ${isActive ? 'filled' : ''}`}
          onClick={() => setReviewRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
          style={{
            fontSize: '2.5rem',
            cursor: 'pointer',
            color: isActive ? '#ffd700' : '#e0e0e0',
            textShadow: isActive ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
            transition: 'all 0.2s ease',
            userSelect: 'none',
            margin: '0 2px',
            display: 'inline-block',
            transform: isActive ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          {isActive ? '⭐' : '☆'}
        </span>
      );
    }
    return stars;
  };

  const groupedPlans = plans.reduce((acc, plan) => {
    if (!acc[plan.planId]) acc[plan.planId] = [];
    acc[plan.planId].push(plan);
    return acc;
  }, {});

  return (
    <div className="plans-section">
      {Object.entries(groupedPlans).length === 0 ? (
        <div className="plan-group">
          <div className="plan-group-title">가입된 요금제가 없습니다</div>
          <p style={{ textAlign: 'center', color: '#be185d', fontSize: '1.1rem' }}>
            새로운 요금제를 가입해보세요! 💕
          </p>
        </div>
      ) : (
        <div className="plan-card-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {Object.entries(groupedPlans).map(([planId, planGroup]) => (
            <div key={planId} className="plan-group">
              <h3 className="plan-group-title">{planGroup[0].planName}</h3>
              {planGroup.map(plan => (
                <PlanCard
                  key={plan.phoneNumber}
                  plan={plan}
                  onCancel={() => handleCancelRequest(plan.lineId)}
                  onReview={handleReview}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {showReviewModal && reviewTarget && (
        <div className="review-modal" onClick={(e) => {
          if (e.target.classList.contains('review-modal')) {
            setShowReviewModal(false);
          }
        }}>
          <div className="review-modal-content">
            <h3>리뷰 작성</h3>
            <p style={{ textAlign: 'center', color: '#be185d', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              {reviewTarget?.planName}
            </p>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem', color: '#be185d', fontWeight: '600' }}>
                요금제 만족도를 평가해주세요!
              </p>
              <div className="star-rating" style={{
                marginBottom: '0.5rem',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '10px',
                border: '2px solid #ffd700'
              }}>
                {renderStars()}
              </div>
              <p style={{ fontSize: '1rem', color: reviewRating > 0 ? '#be185d' : '#666', margin: '0', fontWeight: reviewRating > 0 ? '600' : 'normal' }}>
                {reviewRating > 0 ? `${reviewRating}점 선택됨 💕` : '별점을 선택해주세요'}
              </p>
            </div>

            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="요금제는 어떠셨나요? 소중한 리뷰를 남겨주세요! 💕"
              rows={5}
              style={{ marginBottom: '1rem' }}
            />
            <div className="review-buttons">
              <button onClick={submitReview}>💕 등록하기</button>
              <button onClick={() => setShowReviewModal(false)}>❌ 취소</button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={cancelModalOpen}
        onConfirm={confirmCancel}
        onCancel={() => {
          setCancelModalOpen(false);
          setTargetLineId(null);
        }}
        title="요금제 해지"
        message="정말로 요금제를 해지하시겠습니까?"
        confirmText="해지할래요"
        cancelText="안할래요"
      />

    </div>
  );
};

export default PlansSection;
