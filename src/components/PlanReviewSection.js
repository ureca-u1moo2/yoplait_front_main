// 요금제 상세페이지 하단 리뷰 부분

import React, { useState } from 'react';
import 'styles/PlanReviewSection.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

function PlanReviewSection({ planId, reviews = [], userId, token, onReload }) {
  const [newReview, setNewReview] = useState({ rating: 5, content: '' });
  const [editReviewId, setEditReviewId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className="maid-star">
        {index < rating ? '★' : '☆'}
      </span>
    ));
  };

  const handleCreateReview = async () => {
    if (!newReview.content.trim()) {
      alert('리뷰 내용을 입력해주세요! 💕');
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
        setNewReview({ rating: 5, content: '' });
        onReload();
      } else {
        throw new Error('리뷰 등록에 실패했습니다');
      }
    } catch (err) {
      alert('등록 실패: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId) => {
    if (!editContent.trim()) {
      alert('리뷰 내용을 입력해주세요! 💕');
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
        setEditReviewId(null);
        setEditContent('');
        setEditRating(5);
        onReload();
      } else {
        throw new Error('리뷰 수정에 실패했습니다');
      }
    } catch (err) {
      alert('수정 실패: ' + err.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('정말로 이 리뷰를 삭제하시겠어요? 💔')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/plans/${planId}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'X-AUTH-TOKEN': token
        }
      });

      if (response.ok) {
        onReload();
      } else {
        throw new Error('리뷰 삭제에 실패했습니다');
      }
    } catch (err) {
      alert('삭제 실패: ' + err.message);
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
          {reviews.map(review => {
            console.log('👤 리뷰 작성자 userId:', review.userId);
            console.log('👤 현재 로그인 유저 userId:', userId);
            console.log('⚖️ 일치?', String(review.userId) === String(userId));

            return (
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
                          {n}점 - {renderStars(n).map((star, i) => star.props.children).join('')}
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
                          ✏️ 수정 시작
                        </button>
                        <button onClick={() => handleDeleteReview(review.id)} className="maid-action-btn maid-delete-btn">
                          🗑️ 삭제
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleUpdateReview(review.id)} className="maid-action-btn maid-save-btn">
                          💾 저장
                        </button>
                        <button onClick={cancelEdit} className="maid-action-btn maid-cancel-btn">
                          ❌ 취소
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="maid-new-review-section">
        <h4 className="maid-new-review-title">새 리뷰 작성</h4>

        <div className="maid-new-review-form">
          <textarea
            value={newReview.content}
            onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
            placeholder="이 요금제에 대한 솔직한 후기를 들려주세요... 어떤 점이 좋았나요? 💕"
            className="maid-review-textarea"
            disabled={isSubmitting}
          />

          <div className="maid-form-row">
            <div className="maid-rating-group">
              <span className="maid-rating-label-new">평점:</span>
              <select
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                className="maid-rating-select"
                disabled={isSubmitting}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>
                    {n}점 {renderStars(n).map((star, i) => star.props.children).join('')}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateReview}
              disabled={isSubmitting || !newReview.content.trim()}
              className="maid-submit-btn"
            >
              {isSubmitting ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanReviewSection;
