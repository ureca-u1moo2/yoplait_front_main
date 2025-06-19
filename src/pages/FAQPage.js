// FAQ 페이지
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Search } from 'lucide-react';
import 'styles/FAQPage.css'; // CSS 파일 import

function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFAQs, setOpenFAQs] = useState({});
  const navigate = useNavigate();

  // FAQ 카테고리
  const categories = [
    { id: 'all', name: '전체', emoji: '🍦' },
    { id: 'service', name: '서비스 이용', emoji: '🍓' },
    { id: 'subscription', name: '요금제 가입', emoji: '📱' },
    { id: 'billing', name: '요금/결제', emoji: '💰' },
    { id: 'mypage', name: '마이페이지', emoji: '👤' },
    { id: 'technical', name: '기술 문의', emoji: '🔧' }
  ];

  // FAQ 데이터
  const faqData = [
    {
      id: 1,
      category: 'service',
      question: '요플레가 무엇인가요?',
      answer: '요플레는 AI가 분석하는 개인 맞춤형 요금제 추천 서비스입니다. 🍓 복잡한 요금제 비교는 이제 그만! 3분만에 최적의 요금제를 찾아보세요. 사용 패턴을 분석하여 가장 적합한 요금제를 추천해드립니다.'
    },
    {
      id: 2,
      category: 'service',
      question: '비회원도 요금제 추천을 받을 수 있나요?',
      answer: '비회원은 아쉽게도 추천을 받을 수 없어요😥 정확하고 개인화된 추천을 원하시면 회원가입을 해주세요!'
    },
    {
      id: 3,
      category: 'subscription',
      question: '요금제 가입은 어떻게 하나요?',
      answer: '요금제 상세페이지에서 전화번호를 입력하고 "지금 가입하기" 버튼을 클릭하시면 됩니다. 📱 로그인하신 회원님은 멤버십 할인 혜택도 받으실 수 있어요!'
    },
    {
      id: 4,
      category: 'subscription',
      question: '요금제 해지는 어떻게 하나요?',
      answer: '마이페이지에서 해지하고 싶은 요금제의 "해지하기" 버튼을 클릭하시면 됩니다!'
    },
    {
      id: 5,
      category: 'billing',
      question: '요금제 할인은 어떻게 받나요?',
      answer: '요플레 회원님께는 멤버십 할인 혜택을 제공합니다! 💰 로그인 후 요금제 상세페이지에서 할인된 가격을 확인하실 수 있어요.'
    },
    {
      id: 6,
      category: 'mypage',
      question: '내 요금제 사용량은 어디서 확인하나요?',
      answer: '마이페이지에서 가입하신 모든 요금제의 사용량과 현황을 확인하실 수 있습니다. 📊 실시간으로 업데이트되니 자주 확인해보세요!'
    },
    {
      id: 7,
      category: 'mypage',
      question: '요금제 리뷰는 어떻게 작성하나요?',
      answer: '마이페이지에서 가입하신 요금제의 "리뷰 작성" 버튼을 클릭하세요! ⭐ 별점과 함께 소중한 후기를 남겨주시면 다른 사용자들에게 큰 도움이 됩니다.'
    },
    {
      id: 8,
      category: 'technical',
      question: '로그인이 안 돼요',
      answer: '이메일과 비밀번호를 다시 한 번 확인해주세요. 🔐 비밀번호를 잊으셨다면 "비밀번호 찾기"를 이용해주세요.'
    },
    {
      id: 9,
      category: 'technical',
      question: '페이지가 느려요',
      answer: '브라우저 캐시를 삭제하거나 다른 브라우저를 사용해보세요. 🌐 크롬, 사파리, 파이어폭스 등을 권장합니다.'
    }
  ];

  // FAQ 토글
  const toggleFAQ = (faqId) => {
    setOpenFAQs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  // 필터링된 FAQ
  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="faq-page-container">
      {/* 장식용 배경 요소들 */}
      <div className="faq-decoration-1">🍓</div>
      <div className="faq-decoration-2">🍦</div>
      <div className="faq-decoration-3">🌺</div>
      <div className="faq-decoration-4">✨</div>

      {/* 페이지 헤더 */}
      <div className="faq-page-header">
        <h1 className="faq-page-title">자주 묻는 질문</h1>
        <p className="faq-page-subtitle">
            요플레에 대해 궁금한 점을 해결해드려요! 
        </p>
      </div>

      {/* 뒤로가기 버튼 */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          className="maid-back-btn" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
          메인으로 돌아가기
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="faq-search-card">
        {/* 검색창 */}
        <div className="faq-search-box">
          <div className="faq-search-icon">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="궁금한 내용을 검색해보세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="faq-search-input"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="faq-category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`faq-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-emoji">{category.emoji}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ 목록 */}
      <div className="faq-list">
        {filteredFAQs.length === 0 ? (
          <div className="faq-empty-state">
            <div className="faq-empty-icon">🔍</div>
            <div className="faq-empty-text">검색 결과가 없어요</div>
            <p style={{ margin: '0', opacity: '0.8' }}>
              다른 키워드로 검색해보거나 카테고리를 변경해보세요!
            </p>
            <button 
              className="faq-reset-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              전체 보기 ✨
            </button>
          </div>
        ) : (
          filteredFAQs.map(faq => (
            <div key={faq.id} className="faq-item">
              <button
                className="faq-question"
                onClick={() => toggleFAQ(faq.id)}
              >
                <span className="faq-q-mark">Q</span>
                <span className="faq-question-text">{faq.question}</span>
                <span className="faq-toggle-icon">
                  {openFAQs[faq.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </span>
              </button>
              
              {openFAQs[faq.id] && (
                <div className="faq-answer">
                  <span className="faq-a-mark">A</span>
                  <div className="faq-answer-text">{faq.answer}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 결과 요약 */}
      <div className="faq-summary">
        <p style={{ margin: '0' }}>
          총 {filteredFAQs.length}개의 질문이 있어요 ✨
          {searchTerm && ` • "${searchTerm}" 검색 결과`}
          {selectedCategory !== 'all' && ` • ${categories.find(c => c.id === selectedCategory)?.name} 카테고리`}
        </p>
      </div>
    </div>
  );
}

export default FAQPage;