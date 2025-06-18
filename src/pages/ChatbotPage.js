import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, ArrowLeft, Lock } from 'lucide-react';
import { userManager } from '../auth';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'styles/ChatbotPage.css'; // 전용 CSS 파일 import

const ChatbotPage = () => {
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [isWaitingForMainReply, setIsWaitingForMainReply] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasActiveButtons, setHasActiveButtons] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(''); // 대기 중인 메시지 저장
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // 스크롤을 맨 아래로 이동하는 함수
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 대화나 대기 메시지가 업데이트될 때마다 스크롤을 아래로
  useEffect(() => {
    scrollToBottom();
  }, [conversations, waitingMessage, isWaitingForMainReply, loading]);

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      try {
        const loggedIn = userManager.isLoggedIn();
        const user = userManager.getUserInfo();
        
        setIsLoggedIn(loggedIn);
        setUserInfo(user);
        
        if (!loggedIn) {
          setAuthError(true);
        }
      } catch (error) {
        console.error('로그인 상태 확인 중 오류:', error);
        setIsLoggedIn(false);
        setUserInfo(null);
        setAuthError(true);
      }
    };

    checkLoginStatus();
  }, []);

  // updateCurrentConversation 함수
  const updateCurrentConversation = (conversationId, parsed) => {
    if (parsed.type === 'WAITING') {
      setWaitingMessage(parsed.message);
      setIsWaitingForMainReply(true);
    } else if (parsed.type === 'MAIN_REPLY') {
      setIsWaitingForMainReply(false);
      setWaitingMessage('');
    }

    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv;

      const updatedConv = { ...conv };

      if (parsed.type === 'WAITING') {
        return updatedConv;
      } else if (parsed.type === 'MAIN_REPLY') {
        if (parsed.message) {
          updatedConv.botMessages = [...updatedConv.botMessages, parsed.message];
        }
      } else {
        if (parsed.message) {
          updatedConv.botMessages = [...updatedConv.botMessages, parsed.message];
        }
      }
      
      if (parsed.buttons) {
        updatedConv.buttons = parsed.buttons;
      }
      if (parsed.cards) {
        updatedConv.cards = parsed.cards;
      }
      if (parsed.lineSelectButton) {
        updatedConv.lineSelectButton = parsed.lineSelectButton;
      }

      return updatedConv;
    }));

    if (parsed.buttons) {
      const hasInputDataButton = parsed.buttons.some(btn => btn.type === 'INPUT_DATA');
      setHasActiveButtons(hasInputDataButton);
    }
  };

  // 인증 토큰 가져오기 함수
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // 공통 메시지 전송 함수 (인증 헤더 추가) - sessionId를 의존성에 추가
  const sendMessage = useCallback(async (userMessage, additionalData = {}) => {
    if (!isLoggedIn) {
      setAuthError(true);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.error('인증 토큰이 없습니다.');
      setAuthError(true);
      return;
    }

    // sessionId가 없으면 대기
    if (!sessionId) {
      console.warn('sessionId가 아직 생성되지 않았습니다.');
      setPendingMessage(userMessage); // 메시지를 저장해둠
      return;
    }

    const newConversation = {
      id: Date.now(),
      userMessage: userMessage,
      botMessages: [],
      buttons: [],
      cards: [],
      lineSelectButton: null,
      hasError: false
    };

    setConversations(prev => [...prev, newConversation]);
    setWaitingMessage('');
    setIsWaitingForMainReply(false);
    setLoading(true);

    try {
      console.log('📤 전송하는 sessionId:', sessionId);
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
      const requestBody = {
        message: userMessage,
        sessionId,
        ...additionalData
      };

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-TOKEN': token, // 인증 헤더 추가
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        // 인증 실패
        console.error('인증 실패: 토큰이 유효하지 않습니다.');
        setAuthError(true);
        setConversations(prev => prev.map(conv => 
          conv.id === newConversation.id 
            ? { 
                ...conv, 
                botMessages: ['❌ 인증이 만료되었습니다. 다시 로그인해주세요.'],
                hasError: true 
              }
            : conv
        ));
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            console.log("SSE 방식")
            const data = line.slice(line.indexOf(':') + 1).trim();
            if (data && data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                updateCurrentConversation(newConversation.id, parsed);
              } catch {
                if (data.trim()) {
                  updateCurrentConversation(newConversation.id, { message: data.trim() });
                }
              }
            }
          } else if (line.trim() && !line.startsWith(':')) {
            console.log("stream 방식")
            try {
              const parsed = JSON.parse(line.trim());
              updateCurrentConversation(newConversation.id, parsed);
            } catch {
              if (line.trim()) {
                updateCurrentConversation(newConversation.id, { message: line.trim() });
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Fetch Error:', error);
      setConversations(prev => prev.map(conv => 
        conv.id === newConversation.id 
          ? { 
              ...conv, 
              botMessages: [`❌ 오류: ${error.message}`],
              hasError: true 
            }
          : conv
      ));
    } finally {
      setLoading(false);
      setWaitingMessage('');
      setIsWaitingForMainReply(false);
    }
  }, [isLoggedIn, sessionId]); // sessionId를 의존성에 추가

  // 세션 ID 생성 및 URL 파라미터 처리
  useEffect(() => {
    if (isLoggedIn && !isInitialized) {
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      setIsInitialized(true);
      console.log('🆕 생성된 sessionId:', newSessionId);

      // URL 파라미터에서 메시지 확인
      const urlParams = new URLSearchParams(window.location.search);
      const initialMessage = urlParams.get('message');
      
      if (initialMessage) {
        // URL에서 message 파라미터 제거
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // 대기 메시지로 저장
        setPendingMessage(decodeURIComponent(initialMessage));
      }

      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = '';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isLoggedIn, isInitialized]);

  // sessionId가 생성되고 대기 중인 메시지가 있으면 전송
  useEffect(() => {
    if (sessionId && pendingMessage && isLoggedIn) {
      console.log('📨 대기 중이던 메시지 전송:', pendingMessage);
      sendMessage(pendingMessage);
      setPendingMessage(''); // 전송 후 초기화
    }
  }, [sessionId, pendingMessage, isLoggedIn, sendMessage]);

  const handleSend = async () => {
    if (!input.trim() || !isLoggedIn) return;
    const userMessage = input.trim();
    setInput('');
    await sendMessage(userMessage);
  };

  // 모든 버튼을 제거하는 공통 함수
  const clearAllButtons = () => {
    setHasActiveButtons(false);
    
    setConversations(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last) {
        last.buttons = [];
        last.lineSelectButton = null;
      }
      return updated;
    });
  };

  // 버튼 클릭 핸들러
  const handleButtonClick = async (button) => {
    if (button.type === 'INPUT_DATA') {
      clearAllButtons();
      await sendMessage(button.value);
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = async () => {
    clearAllButtons();
    await sendMessage("취소");
  };

  // 회선 선택 핸들러
  const handleLineSelect = async (phoneNumber) => {
    const lastConversation = conversations[conversations.length - 1];
    const planIds = lastConversation?.cards?.map(card => card.value?.id).filter(Boolean) || [];

    clearAllButtons();

    const additionalData = {
      planIds,
    };

    console.log('📦 포함된 요금제 IDs:', planIds);
    await sendMessage(phoneNumber, additionalData);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && input.trim() && isLoggedIn) {
      handleSend();
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatData = (amount) => {
    if (amount >= 1024) {
      return `${(amount / 1024).toFixed(1)}GB`;
    }
    return `${amount}MB`;
  };

  // 점점점 애니메이션 컴포넌트
  const TypingIndicator = () => {
    const [dots, setDots] = useState('');
    
    useEffect(() => {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '...') return '.';
          return prev + '.';
        });
      }, 500);
      
      return () => clearInterval(interval);
    }, []);

    return (
      <span className="chatbot-typing-dots">
        {dots}
      </span>
    );
  };

  // 로그인 필요 화면
  if (authError || !isLoggedIn) {
    return (
      <div className="chatbot-page-container">
        <div className="chatbot-main-container">
          <div className="chatbot-auth-required">
            <div className="chatbot-auth-icon">
              <Lock className="w-16 h-16 text-pink-400" />
            </div>
            <h1 className="chatbot-auth-title">로그인이 필요합니다</h1>
            <p className="chatbot-auth-description">
              AI 챗봇 서비스는 로그인한 사용자만 이용할 수 있습니다.<br/>
              개인 맞춤 상담을 위해 로그인해주세요.
            </p>
            <div className="chatbot-auth-buttons">
              <button 
                onClick={() => navigate('/login')}
                className="chatbot-auth-login"
              >
                로그인하기
              </button>
              <button 
                onClick={() => navigate('/')}
                className="chatbot-auth-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="chatbot-bg-element chatbot-bg-1"></div>
        <div className="chatbot-bg-element chatbot-bg-2"></div>
        <div className="chatbot-bg-element chatbot-bg-3"></div>
        <div className="chatbot-bg-emoji chatbot-bg-emoji-1">🍓</div>
        <div className="chatbot-bg-emoji chatbot-bg-emoji-2">🥛</div>
      </div>
    );
  }

  // 메시지 렌더링
  const renderMessage = (content, isUser, key) => {
    return (
      <div key={key} className={`chatbot-message-row ${isUser ? 'chatbot-message-user' : 'chatbot-message-bot'}`}>
        <div className={`chatbot-message-bubble ${isUser ? 'chatbot-user-bubble' : 'chatbot-bot-bubble'}`}>
          {isUser ? content : <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>}
        </div>
      </div>
    );
  };

  const renderCard = (card, index) => {
    const { value } = card;

    return (
      <div key={index} className="chatbot-plan-card">
        <div className="chatbot-card-header">
          <span className="chatbot-card-emoji">🍓</span>
          <h3 className="chatbot-card-title">요금제 정보</h3>
        </div>
        
        <div className="chatbot-card-content">
          <h4 className="chatbot-plan-name">{value.name}</h4>
          <p className="chatbot-plan-description">{value.description}</p>
        </div>

        <div className="chatbot-card-details">
          <div className="chatbot-detail-row">
            <span className="chatbot-detail-label">월 요금:</span>
            <span className="chatbot-detail-price">{formatPrice(value.price)}원</span>
          </div>
          
          <div className="chatbot-detail-row">
            <span className="chatbot-detail-label">데이터:</span>
            <span className="chatbot-detail-value">{formatData(value.dataAmount)}</span>
          </div>
          
          <div className="chatbot-detail-row">
            <span className="chatbot-detail-label">통화:</span>
            <span className="chatbot-detail-value">
              {value.callAmount === 99999 ? '무제한' : `${value.callAmount}분`}
            </span>
          </div>
          
          <div className="chatbot-detail-row">
            <span className="chatbot-detail-label">문자:</span>
            <span className="chatbot-detail-value">
              {value.smsAmount === 99999 ? '무제한' : `${value.smsAmount}건`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderConversation = (conversation, index) => {
    const elements = [];
    
    // 사용자 메시지
    elements.push(renderMessage(conversation.userMessage, true, `user-${conversation.id}`));
    
    // 봇 메시지들
    conversation.botMessages.forEach((botMsg, idx) => {
      elements.push(renderMessage(botMsg, false, `bot-${conversation.id}-${idx}`));
    });
    
    // 카드들
    if (conversation.cards.length > 0) {
      elements.push(
        <div key={`cards-${conversation.id}`} className="chatbot-cards-container">
          <div className="chatbot-cards-scroll">
            {conversation.cards.map((card, idx) => renderCard(card, `card-${conversation.id}-${idx}`))}
          </div>
        </div>
      );
    }
    
    // 회선 선택 버튼들
    if (conversation.lineSelectButton && conversation.lineSelectButton.phoneNumbers && conversation.lineSelectButton.phoneNumbers.length > 0) {
      elements.push(
        <div key={`line-select-${conversation.id}`} className="chatbot-line-select-container">
          <div className="chatbot-line-select-box">
            <div className="chatbot-line-select-header">
              <span className="chatbot-line-emoji">📞</span>
              회선을 선택해주세요
            </div>
            <div className="chatbot-line-buttons">
              {conversation.lineSelectButton.phoneNumbers.map((phoneNumber, idx) => (
                <button
                  key={`line-${conversation.id}-${idx}`}
                  onClick={() => handleLineSelect(phoneNumber)}
                  disabled={loading}
                  className={`chatbot-line-button ${loading ? 'chatbot-btn-disabled' : ''}`}
                >
                  {phoneNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // 버튼들
    if (conversation.buttons.length > 0) {
      const hasInputDataButton = conversation.buttons.some(btn => btn.type === 'INPUT_DATA');
      
      elements.push(
        <div key={`buttons-${conversation.id}`} className="chatbot-buttons-container">
          <div className="chatbot-buttons-list">
            {conversation.buttons.map((btn, idx) => {
              if (btn.type === 'URL') {
                return (
                  <a
                    key={`btn-${conversation.id}-${idx}`}
                    href={btn.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chatbot-url-button"
                  >
                    <span className="chatbot-btn-emoji">🔗</span>
                    {btn.label}
                  </a>
                );
              } else if (btn.type === 'INPUT_DATA') {
                return (
                  <button
                    key={`btn-${conversation.id}-${idx}`}
                    onClick={() => handleButtonClick(btn)}
                    disabled={loading}
                    className={`chatbot-input-button ${loading ? 'chatbot-btn-disabled' : ''}`}
                  >
                    <span className="chatbot-btn-emoji">🎯</span>
                    {btn.label}
                  </button>
                );
              }
              return null;
            })}
            
            {hasInputDataButton && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className={`chatbot-cancel-button ${loading ? 'chatbot-btn-disabled' : ''}`}
              >
                <X className="chatbot-cancel-icon" />
                취소
              </button>
            )}
          </div>
        </div>
      );
    }
    
    return elements;
  };

  // 기존 onChange 핸들러를 수정
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (debounceTimer) clearTimeout(debounceTimer);

    if (value.trim().length >= 6) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`http://localhost:8080/api/questions/search?q=${encodeURIComponent(value)}`);
          const data = await response.json();
          setSuggestions(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('추천 질문 검색 실패:', error);
        }
      }, 500);
      setDebounceTimer(timer);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="chatbot-page-container">
      {/* Chat Container */}
      <div className="chatbot-main-container">
        {/* Welcome Section */}
        <div className="chatbot-welcome-section">
          <div className="chatbot-welcome-icon">
            <div className="chatbot-welcome-circle">
              <MessageCircle className="chatbot-welcome-message-icon" />
            </div>
          </div>
          <h1 className="chatbot-welcome-title">
            <span className="chatbot-title-highlight">AI 챗봇</span>과 대화하기
          </h1>
          <p className="chatbot-welcome-description">
            안녕하세요, <strong>{userInfo?.name || userInfo?.email?.split('@')[0] || '회원'}님</strong>! 🍦<br/>
            궁금한 요금제나 통신 관련 질문을 자유롭게 물어보세요.<br/> 
            AI가 개인 맞춤 상담으로 친절하게 답변해드립니다!
          </p>
        </div>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="chatbot-messages-container">
          {conversations.length === 0 && !loading && !waitingMessage ? (
            <div className="chatbot-empty-state">
              <div className="chatbot-empty-icon">💬</div>
              <p className="chatbot-empty-text">메시지를 입력하고 전송 버튼을 클릭하세요.</p>
              <div className="chatbot-suggestions">
                <p className="chatbot-suggestions-title">💡 이런 질문을 해보세요:</p>
                <div className="chatbot-suggestions-list">
                  <button 
                    onClick={() => setInput("요금제 추천해줘")}
                    className="chatbot-suggestion-chip"
                  >
                    요금제 추천해줘
                  </button>
                  <button 
                    onClick={() => setInput("데이터 많이 쓰는 요금제")}
                    className="chatbot-suggestion-chip"
                  >
                    데이터 많이 쓰는 요금제
                  </button>
                  <button 
                    onClick={() => setInput("전체 요금제 보여줘")}
                    className="chatbot-suggestion-chip"
                  >
                    전체 요금제 보여줘
                  </button>
                </div>
              </div>
              {hasActiveButtons && (
                <div className="chatbot-waiting-buttons">
                  🔒 버튼 선택 대기 중입니다. 아래의 버튼을 클릭해주세요.
                </div>
              )}
            </div>
          ) : (
            <>
              {conversations.map((conversation, index) => (
                <div key={`conv-${conversation.id}`}>
                  {renderConversation(conversation, index)}
                </div>
              ))}
              
              {waitingMessage && (
                <div className="chatbot-waiting-message">
                  <div className="chatbot-waiting-bubble">
                    💭 {waitingMessage}
                  </div>
                </div>
              )}
              
              {isWaitingForMainReply && (
                <div className="chatbot-typing-container">
                  <div className="chatbot-typing-bubble">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </>
          )}
          
          {loading && !waitingMessage && (
            <div className="chatbot-loading-container">
              <div className="chatbot-loading-content">
                <div className="chatbot-loading-spinner"></div>
                응답을 기다리는 중...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="chatbot-input-container">
          <div className="chatbot-input-wrapper">
            <input
                type="text"
                placeholder={hasActiveButtons ? "버튼을 클릭해주세요" : "메시지를 입력하세요"}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={`chatbot-input ${hasActiveButtons ? 'chatbot-input-disabled' : ''}`}
                disabled={loading || hasActiveButtons}
            />
            <button
                onClick={handleSend}
                disabled={loading || !input.trim() || hasActiveButtons}
                className={`chatbot-send-button ${
                    (loading || !input.trim() || hasActiveButtons) ? 'chatbot-send-disabled' : ''
                }`}
            >
              {loading ? (
                  <div className="chatbot-send-loading">
                    <div className="chatbot-send-spinner"></div>
                    전송중
                  </div>
              ) : (
                  <div className="chatbot-send-content">
                    <Send className="chatbot-send-icon" />
                    전송
                  </div>
              )}
            </button>
          </div>
        </div>


        {/* Footer Tips */}
        {suggestions.length > 0 && (
            <div className="chatbot-tips">
              <p className="chatbot-tips-title">💡 이런 문장은 어때요?</p>
              <p className="chatbot-tips-text">
                {suggestions.map((s, idx) => (
                    <span key={idx}>
                        <strong>“{s}”</strong>
                        {idx < suggestions.length - 1 && ', '}
                    </span>
                ))}
              </p>
            </div>
        )}

      </div>

      {/* Background Elements */}
      <div className="chatbot-bg-element chatbot-bg-1"></div>
      <div className="chatbot-bg-element chatbot-bg-2"></div>
      <div className="chatbot-bg-element chatbot-bg-3"></div>
      <div className="chatbot-bg-emoji chatbot-bg-emoji-1">🍓</div>
      <div className="chatbot-bg-emoji chatbot-bg-emoji-2">🥛</div>
    </div>
  );
};

export default ChatbotPage;