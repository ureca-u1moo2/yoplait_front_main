


// //요금제 비교페이지

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Smartphone, Phone, MessageSquare, Gift, User, ArrowLeft, Sparkles
} from 'lucide-react';
import 'styles/PlanComparePage.css';
import { NotificationProvider, useNotification } from 'context/NotificationContext'; // 알림 컨텍스트

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

// 내부 컴포넌트 분리해서 Provider 안에서만 useNotification 사용
const PlanCompareInner = () => {
  const [plans, setPlans] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [selectedUserPlan, setSelectedUserPlan] = useState('');
  const [userPlanIds, setUserPlanIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification(); 
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const accessToken = localStorage.getItem("accessToken");

  const formatDataAmount = (amount) => {
    if (amount === -1) return "무제한";
    if (amount >= 1024) return `${Math.floor(amount / 1024)}GB`;
    return `${amount}MB`;
  };

  // AI 요약 파싱 함수
  const parseAiSummary = (summary) => {
    if (!summary) return null;
    
    const sections = {
      comparison: '',
      prosAndCons: [],
      recommendations: []
    };

    // ① 요약 비교 파싱
    const comparisonMatch = summary.match(/①\s*요약\s*비교\s*\n?(.*?)(?=②|$)/s);
    if (comparisonMatch) {
      sections.comparison = comparisonMatch[1].trim();
    }

    // ② 장점과 단점 파싱
    const prosConsMatch = summary.match(/②\s*장점과\s*단점\s*\n?(.*?)(?=③|$)/s);
    if (prosConsMatch) {
      const prosConsText = prosConsMatch[1];
      const planMatches = prosConsText.match(/\[([^\]]+)\]\s*\n?\s*-\s*장점\s*:\s*([^\n]*)\s*\n?\s*-\s*단점\s*:\s*([^\n]*)/g);
      
      if (planMatches) {
        planMatches.forEach(match => {
          const planMatch = match.match(/\[([^\]]+)\]\s*\n?\s*-\s*장점\s*:\s*([^\n]*)\s*\n?\s*-\s*단점\s*:\s*([^\n]*)/);
          if (planMatch) {
            sections.prosAndCons.push({
              planName: planMatch[1].trim(),
              pros: planMatch[2].trim(),
              cons: planMatch[3].trim()
            });
          }
        });
      }
    }

    // ③ 추천 사용자 파싱
    const recommendationsMatch = summary.match(/③\s*추천\s*사용자\s*\n?(.*?)$/s);
    if (recommendationsMatch) {
      const recommendationsText = recommendationsMatch[1];
      const recMatches = recommendationsText.match(/(.+?)\s*:\s*(.+)/g);
      
      if (recMatches) {
        recMatches.forEach(match => {
          const recMatch = match.match(/(.+?)\s*:\s*(.+)/);
          if (recMatch) {
            sections.recommendations.push({
              plan: recMatch[1].trim(),
              recommendation: recMatch[2].trim()
            });
          }
        });
      }
    }

    return sections;
  };



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

      // AI 비교 분석 요약 불러오기
      setIsAiLoading(true);
      fetch(`${API_BASE_URL}/api/plans/compare/ai?planIds=${ids}`)
        .then(res => res.json())
        .then(data => {
          setAiSummary(data.data?.aiSummary || '');
          setIsAiLoading(false);
        })
        .catch(err => {
          console.error('AI 분석 실패:', err);
          setAiSummary('AI 분석을 불러오는 데 실패했어요 💔');
          setIsAiLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [params]);

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

  const handleAddUserPlan = () => {
    if (!selectedUserPlan) {
      showNotification("요금제를 선택해주세요 💕");
      return;
    }

    const currentParams = params.get('ids');
    const existingIds = currentParams ? currentParams.split(',') : [];

    if (existingIds.includes(selectedUserPlan)) {
      showNotification("error", "이미 비교하고 있는 요금제 입니다!");
      return;
    }

    const newIds = [...existingIds, selectedUserPlan].join(',');
    navigate(`/plans/compare?ids=${newIds}`);
    setSelectedUserPlan('');
    showNotification("success", "요금제를 성공적으로 추가했어요!");
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

  const parsedAiSummary = parseAiSummary(aiSummary);

  return (
    <div className="compare-page-container">
      <div className="compare-decoration-1">🎀</div>
      <div className="compare-decoration-2">💖</div>
      <div className="compare-decoration-3">🌺</div>

      <div className="compare-page-header">
        <h1 className="compare-page-title">요금제 비교</h1>
        <p className="compare-page-subtitle">
          선택하신 요금제들을 꼼꼼히 비교해보고 가장 달콤한 선택을 해보세요 ♡
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button className="maid-back-btn" onClick={handleBackToList}>
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
          요금제 목록으로 돌아가기
        </button>
      </div>

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
        <>
          {/* AI 비교 요약 섹션 */}
          {(aiSummary || isAiLoading) && (
            <div style={{
              marginBottom: '2rem',
              padding: '2rem',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #fef7ff 0%, #fce7f3 50%, #f9a8d4 100%)',
              border: '2px solid #f472b6',
              boxShadow: '0 8px 32px rgba(244, 114, 182, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* 배경 장식 */}
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
                <Sparkles style={{
                  ...pinkIconStyle,
                  background: 'linear-gradient(135deg, #ec4899, #be185d)',
                  color: 'white'
                }} size={24} />
                <h3 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#be185d',
                  textShadow: '0 2px 4px rgba(190, 24, 93, 0.1)'
                }}>
                  AI 요플레의 요금제 비교 분석 
                </h3>
              </div>

              {isAiLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#be185d',
                  fontSize: '1.1rem'
                }}>
                  <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🤖💭</div>
                  AI가 열심히 분석하고 있어요... 잠시만 기다려주세요!
                </div>
              ) : parsedAiSummary ? (
                <div>
                  {/* 요약 비교 */}
                  {parsedAiSummary.comparison && (
                    <div style={{
                      marginBottom: '2rem',
                      padding: '1.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '15px',
                      border: '1px solid rgba(244, 114, 182, 0.3)'
                    }}>
                      <h4 style={{
                        margin: '0 0 1rem 0',
                        color: '#be185d',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🍓 한눈에 보는 비교
                      </h4>
                      <p style={{
                        margin: 0,
                        color: '#831843',
                        fontSize: '1.1rem',
                        lineHeight: '1.6',
                        fontWeight: '500'
                      }}>
                        {parsedAiSummary.comparison}
                      </p>
                    </div>
                  )}

                  {/* 장점과 단점 - 가로 배열 */}
                  {parsedAiSummary.prosAndCons.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{
                        margin: '0 0 1.5rem 0',
                        color: '#be185d',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                         장점 vs 단점
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: parsedAiSummary.prosAndCons.length === 1 ? '1fr' : 
                                           parsedAiSummary.prosAndCons.length === 2 ? 'repeat(2, 1fr)' :
                                           'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1rem'
                      }}>
                        {parsedAiSummary.prosAndCons.map((item, index) => (
                          <div key={index} style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            border: '1px solid rgba(244, 114, 182, 0.3)',
                            boxShadow: '0 4px 16px rgba(244, 114, 182, 0.1)'
                          }}>
                            <h5 style={{
                              margin: '0 0 1rem 0',
                              color: '#be185d',
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              textAlign: 'center',
                              padding: '0.5rem',
                              backgroundColor: 'rgba(244, 114, 182, 0.1)',
                              borderRadius: '8px'
                            }}>
                              {item.planName}
                            </h5>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{
                                color: '#059669',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                marginBottom: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                 장점
                              </div>
                              <div style={{
                                color: '#065f46',
                                fontSize: '0.95rem',
                                lineHeight: '1.4'
                              }}>
                                {item.pros}
                              </div>
                            </div>
                            <div>
                              <div style={{
                                color: '#dc2626',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                marginBottom: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                 단점
                              </div>
                              <div style={{
                                color: '#991b1b',
                                fontSize: '0.95rem',
                                lineHeight: '1.4'
                              }}>
                                {item.cons}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  
                  {parsedAiSummary.recommendations.length > 0 && (
                    <div>
                      <h4 style={{
                        margin: '0 0 1rem 0',
                        color: '#be185d',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        💡 이런 분께 추천해요
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: parsedAiSummary.recommendations.length === 1 ? '1fr' : 
                                           parsedAiSummary.recommendations.length === 2 ? 'repeat(2, 1fr)' :
                                           'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '0.75rem'
                      }}>
                        {parsedAiSummary.recommendations.map((item, index) => (
                          <div key={index} style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '10px',
                            padding: '1rem',
                            border: '1px solid rgba(244, 114, 182, 0.3)',
                            textAlign: 'center'
                          }}>
                            <div style={{
                              color: '#be185d',
                              fontSize: '1rem',
                              fontWeight: '600',
                              marginBottom: '0.5rem'
                            }}>
                              {item.plan}요금제
                            </div>
                            <div style={{
                              color: '#831843',
                              fontSize: '0.95rem',
                              lineHeight: '1.4'
                            }}>
                              {item.recommendation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  color: '#be185d',
                  fontSize: '1rem'
                }}>
                  {aiSummary || 'AI 분석 결과가 없어요 💔'}
                </div>
              )}
            </div>
          )}

          {/* 요금제 비교 카드들 */}
          <div className="compare-grid">
            {plans.map(plan => (
              <div 
                key={plan.id} 
                className={`maid-compare-card ${userPlanIds.includes(plan.id) ? 'is-my-plan' : ''}`}
                onClick={() => navigate(`/plans/${plan.id}`)}
              >
                <div className="compare-card-header">
                  <h3 className="compare-plan-name">{plan.name}</h3>
                  <div className="compare-price-tag">{plan.price.toLocaleString()}원</div>
                </div>

                <div className="compare-plan-info">
                  <div className="compare-info-item">
                    <div className="compare-info-icon"><Smartphone size={20} /></div>
                    <div className="compare-info-content">
                      <div className="compare-info-label">데이터</div>
                      <div className="compare-info-value">{formatDataAmount(plan.dataAmount)}</div>
                    </div>
                  </div>
                  <div className="compare-info-item">
                    <div className="compare-info-icon"><Phone size={20} /></div>
                    <div className="compare-info-content">
                      <div className="compare-info-label">통화</div>
                      <div className="compare-info-value">{plan.callAmount === -1 ? '무제한' : `${plan.callAmount}분`}</div>
                    </div>
                  </div>
                  <div className="compare-info-item">
                    <div className="compare-info-icon"><MessageSquare size={20} /></div>
                    <div className="compare-info-content">
                      <div className="compare-info-label">문자</div>
                     <div className="compare-info-value">{plan.smsAmount >= 15000 ? `기본제공` : `${plan.smsAmount}건`}</div>

                    </div>
                  </div>
                  {plan.specialFeatures && (
                    <div className="compare-info-item">
                      <div className="compare-info-icon"><Gift size={20} /></div>
                      <div className="compare-info-content">
                        <div className="compare-info-label">특별혜택</div>
                        <div className="compare-info-value">{plan.specialFeatures}</div>
                      </div>
                    </div>
                  )}
                  {plan.carrier && (
                    <div className="compare-info-item">
                      <div className="compare-info-icon"><span style={{ fontSize: '1.2rem' }}>📡</span></div>
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
        </>
      )}

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
            총 {plans.length}개의 요금제를 비교하고 있어요 ✨<br />
            각 카드를 클릭하면 상세 정보를 볼 수 있어요!
          </p>
        </div>
      )}
    </div>
  );
};

// 외부에서 NotificationProvider로 감싸서 export
const PlanComparePage = () => (
  <NotificationProvider>
    <PlanCompareInner />
  </NotificationProvider>
);

export default PlanComparePage;