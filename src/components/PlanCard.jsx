// 마이페이지 내 본인 가입 요금제 목록

import React from 'react';
import { Smartphone, Calendar, DollarSign } from 'lucide-react';
import 'styles/PlanCard.css'; 
import { useNavigate } from 'react-router-dom';

const PlanCard = ({ plan, onCancel, onReview }) => {
  const navigate = useNavigate();
  return (
    <div
      className="plan-card"
      onClick={() => navigate(`/plans/${plan.planId}`)}
      style={{ cursor: 'pointer' }}
    >
      {/* 전화번호 */}
      <div className="plan-info-item">
        <span className="pink-icon">
          <Smartphone size={16} />
        </span>
        <h4 className="plan-phone">{plan.phoneNumber}</h4>
      </div>

      {/* 설명 */}
      <p className="plan-description">{plan.description}</p>

      {/* 가입일 */}
      <div className="plan-info-item">
        <span className="pink-icon">
          <Calendar size={16} />
        </span>
        <p className="plan-date">가입일: {new Date(plan.startDate).toLocaleDateString()}</p>
      </div>

      {/* 할인 가격 */}
      <div className="plan-info-item">
        <span className="pink-icon">
          <DollarSign size={16} />
        </span>
        <p className="plan-price">가격: {plan.discountedPrice}원</p>
      </div>

      {/* 버튼 */}
      <div className="plan-buttons">
        {/* <button onClick={() => onCancel(plan.lineId)}>요금제 해지</button>
        <button onClick={() => onReview(plan)}>리뷰 작성</button> */}
        <button onClick={(e) => { e.stopPropagation(); onCancel(plan.lineId); }}>요금제 해지</button>
        <button onClick={(e) => { e.stopPropagation(); onReview(plan); }}>리뷰 작성</button>
      </div>
    </div>
  );
};

export default PlanCard;
