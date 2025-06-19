// 요금제 목록 페이지

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {   Search, Filter, Heart, Smartphone, Phone, MessageSquare, Gift, Star, Sparkles  } from 'lucide-react';
import 'styles/PlanListPage.css'; // CSS 파일 import

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const pinkIconStyle = {
  color: '#ec4899',
  background: 'linear-gradient(135deg, #fce7f3, #f9a8d4)',
  padding: '6px',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(236, 72, 153, 0.2)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '8px'
};

const floatingIconStyle = {
  filter: 'drop-shadow(0 2px 4px rgba(236, 72, 153, 0.3))',
  animation: 'float 3s ease-in-out infinite'
};

function PlanListPage() {
  const [plans, setPlans] = useState([]);
  const [sortBy, setSortBy] = useState('popular');
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

    // GB 파싱
  const formatDataAmount = (amount) => {
    if (amount === -1) return "무제한";
    if (amount >= 1024) return `${Math.floor(amount / 1024)}GB`;
    return `${amount}MB`;
  };


  // useEffect(() => {
  //   setIsLoading(true);
  //   fetch(`${API_BASE_URL}/api/plans?sortBy=${sortBy}`)
  //     .then(res => res.json())
  //     .then(data => {
  //       setPlans(data.data || []);
  //       setIsLoading(false);
  //     })
  //     .catch(err => {
  //       console.error('Failed to fetch plans:', err);
  //       setIsLoading(false);
  //     });
  // }, [sortBy]);

  // 페이징
  useEffect(() => {
  setIsLoading(true);
  fetch(`${API_BASE_URL}/api/plans/filter?sortBy=${sortBy}&page=${page}&size=${pageSize}`)
    .then(res => res.json())
    .then(data => {
      setPlans(data.data.content || []);
      setTotalPages(data.data.totalPages || 1);
      setIsLoading(false);
    })
    .catch(err => {
      console.error('Failed to fetch plans:', err);
      setIsLoading(false);
    });
}, [sortBy, page, pageSize]);

  const handleCompare = () => {
    if (selectedPlans.length >= 2) {
      navigate(`/plans/compare?ids=${selectedPlans.join(',')}`);
    } else {
      alert('비교하려면 2개 이상의 요금제를 선택하세요');
    }
  };

  const handlePlanSelect = (planId, isChecked) => {
    const updated = isChecked
      ? [...selectedPlans, planId]
      : selectedPlans.filter(id => id !== planId);
    setSelectedPlans(updated);
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = priceRange === 'all' || 
      (priceRange === 'low' && plan.price < 30000) ||
      (priceRange === 'mid' && plan.price >= 30000 && plan.price < 60000) ||
      (priceRange === 'high' && plan.price >= 60000);
    
    return matchesSearch && matchesPrice;
  });

  if (isLoading) {
    return (
      <div className="plan-page-container">
        <div className="maid-loading">💕 요금제 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="plan-page-container">
      {/* 장식용 배경 요소들 */}
      <div className="maid-decoration-1">🎀</div>
      <div className="maid-decoration-2">💖</div>
      <div className="maid-decoration-3">🌺</div>

      {/* 페이지 헤더 */}
      <div className="maid-page-header">
        <h1 className="maid-page-title">요금제 목록</h1>
        <p className="maid-page-subtitle">
          달콤한 다양한 요금제를 사르르 비교하고 내 입맛에 맞는 요금제를 찾아보세요 ♡
        </p>
      </div>

      {/* 검색 및 필터 카드 */}
      <div className="maid-search-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* 필터 및 정렬 */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#be185d', fontWeight: '500', fontSize: '0.9rem' }}>정렬:</span>
                <select 
                  className="maid-select"
                  onChange={e => setSortBy(e.target.value)} 
                  value={sortBy}
                >
                  <option value="popular">인기순</option>
                  <option value="priceAsc">가격 낮은순</option>
                  <option value="priceDesc">가격 높은순</option>
                  <option value="dataDesc">데이터 많은순</option>
                </select>
              </div>
            </div>
            
            <button 
              className="maid-compare-btn"
              onClick={handleCompare}
              disabled={selectedPlans.length < 2}
            >
              비교하기 ({selectedPlans.length})
            </button>
          </div>
        </div>
      </div>

      {/* 요금제 목록 */}
      {filteredPlans.length === 0 ? (
        <div className="maid-empty-state">
          <div className="maid-empty-icon">💔</div>
          <div className="maid-empty-text">
            {searchTerm || priceRange !== 'all' 
              ? '검색 조건에 맞는 요금제가 없어요' 
              : '표시할 요금제가 없어요'}
          </div>
          <p style={{ margin: '0', opacity: '0.8' }}>다른 조건으로 다시 검색해보세요!</p>
          {(searchTerm || priceRange !== 'all') && (
            <button 
              className="maid-reset-btn"
              onClick={() => {
                setSearchTerm('');
                setPriceRange('all');
              }}
            >
              필터 초기화 ✨
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredPlans.map(plan => (
            <div key={plan.id} className="maid-plan-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* 체크박스 */}
                <div style={{ paddingTop: '0.25rem' }}>
                  <input 
                    type="checkbox" 
                    id={`plan-${plan.id}`}
                    onChange={e => handlePlanSelect(plan.id, e.target.checked)}
                    className="maid-checkbox"
                  />
                </div>
                
                {/* 요금제 정보 */}
                <div 
                  onClick={() => navigate(`/plans/${plan.id}`)}
                  className="maid-plan-content"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <h3 className="maid-plan-name" style={{ margin: 0, marginRight: '0.5rem' }}>
                        {plan.name}
                      </h3>
                      {/* 요금제 태그 */}
                      {plan.tags && plan.tags.length > 0 && (
                        <div className="maid-tag-list-inline">
                          {plan.tags.map(tag => (
                            <div key={tag.id} className="maid-tag-item-inline">
                              <span className="maid-tag-name">#{tag.tagName}</span>
                              <span className="maid-tag-desc">{tag.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="maid-price-tag">
                      {plan.price.toLocaleString()}원
                    </div>
                  </div>                
                  <div className="maid-plan-info">
                    <div className="maid-info-item">
                      <span style={pinkIconStyle}>
                        <Smartphone size={16} />
                      </span>
                      <span>데이터: {formatDataAmount(plan.dataAmount)} </span>
                    </div>
                    <div className="maid-info-item">
                      <span style={pinkIconStyle}>
                        <Phone size={16} />
                      </span>
                      <span>통화: {plan.callAmount === -1 ? '무제한' : `${plan.callAmount}분`}</span>
                    </div>
                    <div className="maid-info-item">
                      <span style={pinkIconStyle}>
                        <MessageSquare size={16} />
                      </span>
                      <span>
  문자: {plan.smsAmount >= 15000 ? `기본제공(${plan.smsAmount}건)` : `${plan.smsAmount}건`}
</span>
                    </div>
                    {plan.specialFeatures && (
                      <div className="maid-info-item">
                        <span style={pinkIconStyle}>
                          <Gift size={16} />
                        </span>
                        <span>특별혜택: {plan.specialFeatures}</span>
                      </div>
                    )}
                  </div>

                  {/* 통신사 정보 */}
                  {plan.carrier && (
                    <div className="maid-carrier-info">
                      {plan.carrier}
                      {plan.networkType && ` • ${plan.networkType}`}
                      {plan.popularity && ` • 인기도 ${plan.popularity}%`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 선택된 요금제 플로팅 버튼 */}
      {selectedPlans.length > 0 && (
        <div className="maid-floating-compare">
          <div className="maid-floating-info">
            <p className="maid-floating-main">
              {selectedPlans.length}개 요금제 선택됨 💕
            </p>
            <p className="maid-floating-sub">
              마음에 드는 요금제를 골라보세요!
            </p>
          </div>
          <button 
            className="maid-compare-btn"
            onClick={handleCompare}
            disabled={selectedPlans.length < 2}
            style={{ margin: '0', padding: '0.6rem 1.5rem' }}
          >
            비교하기
          </button>
        </div>
      )}

      {/* 결과 요약 */}
      <div className="maid-summary">
        <p style={{ margin: '0' }}>
          총 {filteredPlans.length}개의 요금제가 있어요 ✨
          {searchTerm && ` • "${searchTerm}" 검색 결과`}
          {priceRange !== 'all' && ` • ${priceRange === 'low' ? '3만원 미만' : priceRange === 'mid' ? '3-6만원' : '6만원 이상'} 필터 적용`}
        </p>
      </div>

      {/* 페이지네이션 UI 추가 */}
      <div className="maid-pagination">
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx}
            className={`maid-page-btn ${page === idx ? 'active' : ''}`}
            onClick={() => setPage(idx)}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PlanListPage;
