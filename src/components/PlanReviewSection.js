// // 요금제 상세페이지 하단 리뷰 부분
import React, { useState } from 'react';
import { useNotification } from 'context/NotificationContext';
import 'styles/PlanReviewSection.css';
import DeleteConfirmModal from '../components/DeleteConfirmModal'; // 올바른 경로로 수정

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

function PlanReviewSection({ planId, reviews = [], userId, token, onReload }) {
  const [newReview, setNewReview] = useState({ rating: 5, content: '' });
  const [editReviewId, setEditReviewId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetReviewId, setTargetReviewId] = useState(null);
  const { showNotification } = useNotification();

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className="maid-star">
        {index < rating ? '★' : '☆'}
      </span>
    ));
  };

  const handleCreateReview = async () => {
    if (!newReview.content.trim()) {
      showNotification('info', '리뷰 내용을 입력해주세요! 💕');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/plans/${planId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-TOKEN': token
        },
        body: JSON.stringify(newReview)
      });

      if (response.ok) {
        showNotification('success', '리뷰가 등록되었어요! ✨');
        setNewReview({ rating: 5, content: '' });
        onReload();
      } else {
        throw new Error('리뷰 등록에 실패했습니다');
      }
    } catch (err) {
      showNotification('error', '등록 실패: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId) => {
    if (!editContent.trim()) {
      showNotification('info', '리뷰 내용을 입력해주세요! 💕');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/plans/${planId}/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-TOKEN': token
        },
        body: JSON.stringify({ rating: editRating, content: editContent })
      });

      if (response.ok) {
        showNotification('success', '리뷰가 수정되었어요! 💫');
        setEditReviewId(null);
        setEditContent('');
        setEditRating(5);
        onReload();
      } else {
        throw new Error('리뷰 수정에 실패했습니다');
      }
    } catch (err) {
      showNotification('error', '수정 실패: ' + err.message);
    }
  };

  const handleDeleteClick = (reviewId) => {
    setTargetReviewId(reviewId);
    setModalOpen(true);
  };

  const handleDeleteReview = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/plans/${planId}/reviews/${targetReviewId}`, {
        method: 'DELETE',
        headers: { 'X-AUTH-TOKEN': token }
      });

      if (response.ok) {
        showNotification('success', '리뷰가 삭제되었어요 🗑️');
        onReload();
      } else {
        throw new Error('리뷰 삭제에 실패했습니다');
      }
    } catch (err) {
      showNotification('error', '삭제 실패: 본인이 작성한 리뷰만 삭제할 수 있어요!');
    } finally {
      setModalOpen(false);
      setTargetReviewId(null);
    }
  };

  const startEdit = (review) => {
    setEditReviewId(review.id);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

  const cancelEdit = () => {
    setEditReviewId(null);
    setEditContent('');
    setEditRating(5);
  };

  return (
    <div className="maid-review-section">
      <div className="maid-review-header">
        <h3 className="maid-review-title">요금제 리뷰</h3>
      </div>

      {reviews.length === 0 ? (
        <div className="maid-empty-reviews">
          <div className="maid-empty-icon">🌟</div>
          <p className="maid-empty-text">
            아직 리뷰가 없어요! 첫 번째 리뷰를 작성해보세요 ✨
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '2rem' }}>
          {reviews.map(review => (
            <div key={review.id} className={`maid-review-card ${editReviewId === review.id ? 'editing' : ''}`}>
              <div className="maid-review-rating">
                <span className="maid-rating-label">평점:</span>
                <div className="maid-rating-stars">{renderStars(review.rating)}</div>
                <span style={{ color: '#be185d', fontWeight: '600', marginLeft: '0.5rem' }}>
                  ({review.rating}/5)
                </span>
              </div>

              {editReviewId !== review.id ? (
                <div className="maid-review-content">{review.content}</div>
              ) : (
                <div className="maid-edit-form">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="리뷰를 수정해주세요... 💕"
                    className="maid-edit-input"
                  />
                  <select
                    value={editRating}
                    onChange={(e) => setEditRating(Number(e.target.value))}
                    className="maid-rating-select"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>
                        {n}점 - {renderStars(n).map(star => star.props.children).join('')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {String(review.userId) === String(userId) && (
                <div className="maid-review-actions">
                  {editReviewId !== review.id ? (
                    <>
                      <button onClick={() => startEdit(review)} className="maid-action-btn maid-edit-btn">
                        수정 시작
                      </button>
                      <button onClick={() => handleDeleteClick(review.id)} className="maid-action-btn maid-delete-btn">
                        삭제
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleUpdateReview(review.id)} className="maid-action-btn maid-save-btn">
                        저장
                      </button>
                      <button onClick={cancelEdit} className="maid-action-btn maid-cancel-btn">
                        취소
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={modalOpen}
        onConfirm={handleDeleteReview}
        onCancel={() => {
          setModalOpen(false);
          setTargetReviewId(null);
        }}
      />
    </div>
  );
}

export default PlanReviewSection;
