import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, ArrowLeft, Lock, Home, ExternalLink } from 'lucide-react';
import { userManager } from '../auth';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'styles/ChatbotPage.css';
import { encodeWAV, downsampleBuffer } from '../utils/audioUtils';
import { Mic, MicOff } from 'lucide-react';
import { ChatCommand } from '../constants/chatCommands';

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
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const bufferRef = useRef([]);

  // 버튼별 커스텀 설정을 반환하는 함수
  const getButtonConfig = (button) => {
    const configs = {
      '성향 분석 하기': {
        emoji: '🔍',
        className: 'chatbot-analysis-button'
      },
      '요금제 추천 모드 종료': {
        emoji: '❌',
        className: 'chatbot-cancel-button'
      },
      '개인 맞춤 추천': {
        emoji: '⭐',
        className: 'chatbot-recommend-button'
      },
      '취소': {
        emoji: '❌',
        className: 'chatbot-cancel-button'
      },
      '다시 시작': {
        emoji: '🔄',
        className: 'chatbot-restart-button'
      },
      '추천받기': {
        emoji: '💎',
        className: 'chatbot-premium-button'
      }
    };

    const defaultConfig = {
      emoji: button.type === 'EVENT' ? '🧠' : '🎯',
      className: button.type === 'EVENT' ? 'chatbot-event-button' : 'chatbot-input-button'
    };

    return configs[button.label] || defaultConfig;
  };

  // 회선 선택이 활성화되어 있는지 확인하는 함수
  const hasActiveLineSelection = () => {
    const lastConversation = conversations[conversations.length - 1];
    return lastConversation?.lineSelectButton?.phoneNumbers?.length > 0;
  };

  // 스크롤을 맨 아래로 이동하는 함수
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  // 공통 메시지 전송 함수
  const sendMessage = useCallback(async (userMessage, additionalData = {}, command = ChatCommand.CHAT) => {
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
        command,
        ...additionalData
      };

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-TOKEN': token,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
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
              botMessages: ['🥺 앗! 응답 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'],
              hasError: true 
            }
          : conv
      ));
    } finally {
      setLoading(false);
      setWaitingMessage('');
      setIsWaitingForMainReply(false);
    }
  }, [isLoggedIn, sessionId]);

  // 세션 ID 생성 및 URL 파라미터 처리
  useEffect(() => {
    if (isLoggedIn && !isInitialized) {
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      setIsInitialized(true);
      console.log('🆕 생성된 sessionId:', newSessionId);

      const urlParams = new URLSearchParams(window.location.search);
      const initialMessage = urlParams.get('message');
      
      if (initialMessage) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        setTimeout(() => {
          sendMessage(decodeURIComponent(initialMessage));
        }, 1000);
      }

      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = '';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isLoggedIn, isInitialized, sendMessage]);

  const handleSend = async () => {
    if (!input.trim() || !isLoggedIn) return;
    const userMessage = input.trim();
    setInput('');
    await sendMessage(userMessage, {}, ChatCommand.CHAT);
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
      await sendMessage(button.value,{},ChatCommand.CHAT);
    }
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
    await sendMessage(phoneNumber, additionalData, ChatCommand.CHAT);
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
    if (amount === -1 || amount === 99999) return '무제한';
    if (amount >= 1024) return `${(amount / 1024).toFixed(1)}GB`;
    return `${amount}MB`;
  };

  const formatCall = (amount) => {
    if (amount === -1 || amount === 99999) return '무제한';
    return `${amount}분`;
  };

  const formatSms = (amount) => {
    if (amount >= 15000) return `기본제공`;
    return `${amount}건`;
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
        
        <div className="chatbot-bg-emoji chatbot-bg-emoji-1">🍓</div>
        <div className="chatbot-bg-emoji chatbot-bg-emoji-2">🥛</div>
      </div>
    );
  }

const handleEventButton = async (button) => {
  clearAllButtons();

  let command = ChatCommand.CHAT;

  // 라벨에 따른 명령 분기
// 라벨에 따른 명령 분기 - 정확한 라벨 매칭
  switch (button.label) {
    case '성향 분석 하기':
      command = ChatCommand.START_ANALYSIS;
      break;
    case '요금제 추천 모드 종료':
      console.log("종료 버튼 클릭");
      command = ChatCommand.CANCEL;
      break;  
    case '내게 맞는 요금제 찾기':  // 이 부분이 수정되었습니다
      command = ChatCommand.START_RECOMMENDATION;
      break;
    case '추천받기':  // 기존 케이스도 유지 (다른 곳에서 사용될 수 있음)
      command = ChatCommand.START_RECOMMENDATION;
      break;
    default:
      command = ChatCommand.CHAT;
  }

  try {
    await sendMessage('', {}, command);
  } catch (e) {
    console.error('이벤트 버튼 처리 중 오류 발생:', e); 

    const errorConversation = {
      id: Date.now(),
      userMessage: '',
      botMessages: ['🥺 앗! 버튼 요청 처리 중 문제가 발생했습니다. 다시 시도해주세요.'],
      buttons: [],
      cards: [],
      lineSelectButton: null,
      hasError: true
    };

    setConversations(prev => [...prev, errorConversation]);
  }
};

  // 요금제 상세 페이지로 이동하는 함수
  const handlePlanDetail = (planId) => {
    window.open(`/plans/${planId}`, '_blank');
  };

  // 메시지 렌더링
  const renderMessage = (content, isUser, key) => {
    return (
      <div key={key} className={`chatbot-message-row ${isUser ? 'chatbot-message-user' : 'chatbot-message-bot'}`}>
        <div className={`chatbot-message-bubble ${isUser ? 'chatbot-user-bubble' : 'chatbot-bot-bubble'}`}>
          {isUser ? content : <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p>{children}</p>,
            }}
          >
            {content.replace(/\n/g, '  \n')}
          </ReactMarkdown>
          }
        </div>
      </div>
    );
  };

  const renderCard = (card, index) => {
    const { value } = card;

    return (
      <div key={index} className="chatbot-plan-card">
        <div className="chatbot-card-header">
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
            <span className="chatbot-detail-value">{formatCall(value.callAmount)}</span>
          </div>

          <div className="chatbot-detail-row">
            <span className="chatbot-detail-label">문자:</span>
            <span className="chatbot-detail-value">{formatSms(value.smsAmount)}</span>
          </div>
        </div>

        <div className="chatbot-card-actions">
          <button
            onClick={() => handlePlanDetail(value.id)}
            className="chatbot-detail-button"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            상세보기
          </button>
        </div>
      </div>
    );
  };

  const renderConversation = (conversation, index) => {
    const elements = [];
    
    // 사용자 메시지
    if (conversation.userMessage && conversation.userMessage.trim()) {
      elements.push(renderMessage(conversation.userMessage, true, `user-${conversation.id}`));
    }
    
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
      elements.push(
        <div key={`buttons-${conversation.id}`} className="chatbot-buttons-container">
          <div className="chatbot-buttons-list">
            {conversation.buttons.map((btn, idx) => {
              const buttonConfig = getButtonConfig(btn);
              
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
                    className={`${buttonConfig.className} ${loading ? 'chatbot-btn-disabled' : ''}`}
                  >
                    <span className="chatbot-btn-emoji">{buttonConfig.emoji}</span>
                    {btn.label}
                  </button>
                );
              } else if (btn.type === 'EVENT') {
                return (
                  <button
                    key={`btn-${conversation.id}-${idx}`}
                    onClick={() => handleEventButton(btn)}
                    disabled={loading}
                    className={`${buttonConfig.className} ${loading ? 'chatbot-btn-disabled' : ''}`}
                  >
                    <span className="chatbot-btn-emoji">{buttonConfig.emoji}</span>
                    {btn.label}
                  </button>
                );
              }
              return null;
            })}
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

  // 음성 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];
      bufferRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioCtx = new AudioContext();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const downsampled = downsampleBuffer(audioBuffer, 16000);
        const wavBlob = encodeWAV(downsampled, 16000);

        const formData = new FormData();
        formData.append('file', new Blob([wavBlob], { type: 'audio/wav' }), 'voice.wav');

        const token = getAuthToken();

        const res = await fetch('http://localhost:8080/api/stt', {
          method: 'POST',
          headers: {
            'X-AUTH-TOKEN': token,
          },
          body: formData,
        });

        const resultText = await res.text();
        try {
          const parsed = JSON.parse(resultText);
          const transcript = parsed.transcript?.trim();
          if (transcript) {
            setInput(transcript);
          }
        } catch (e) {
          console.error("STT 응답 파싱 실패:", e);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('🎙️ 음성 녹음 오류:', err);
    }
  };

  // 음성 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="chatbot-page-container">
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-content">
          <button 
            onClick={() => navigate('/')}
            className="chatbot-header-home-btn"
          >
            <Home className="chatbot-header-home-icon" />
            <span>메인으로</span>
          </button>
          
          <div className="chatbot-header-center">
            <MessageCircle className="chatbot-header-bot-icon" />
            <div>
              <h1 className="chatbot-header-title">AI 챗봇</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="chatbot-main-container">
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
              {hasActiveButtons && !hasActiveLineSelection() && (
                <div className="chatbot-waiting-buttons">
                  🔒 버튼 선택 대기 중입니다. 아래의 버튼을 클릭해주세요.
                </div>
              )}
              {hasActiveLineSelection() && (
                <div className="chatbot-waiting-buttons">
                  📞 회선을 선택해주세요.
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

        {/* 오디오 시각화 */}
        {isRecording && (
          <div className="audio-visualizer">
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
          </div>
        )}

        {/* Input Section */}
        <div className="chatbot-input-container">
          <div className="chatbot-input-wrapper">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`chatbot-mic-button ${isRecording ? 'chatbot-mic-recording' : ''}`}
              title={isRecording ? '녹음 중지' : '음성 입력'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              placeholder={isRecording ? "녹음 중입니다..." : (hasActiveButtons || hasActiveLineSelection()) ? "선택을 완료해주세요" : "메시지를 입력하세요"}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className={`chatbot-input ${(hasActiveButtons || hasActiveLineSelection() || isRecording) ? 'chatbot-input-disabled' : ''}`}
              disabled={loading || hasActiveButtons || hasActiveLineSelection() || isRecording}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || hasActiveButtons || hasActiveLineSelection() || isRecording}
              className={`chatbot-send-button ${
                (loading || !input.trim() || hasActiveButtons || hasActiveLineSelection() || isRecording) ? 'chatbot-send-disabled' : ''
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
                  <strong>"{s}"</strong>
                  {idx < suggestions.length - 1 && ', '}
                </span>
              ))}
            </p>
          </div>
        )}
      </div>

      <div className="chatbot-bg-emoji chatbot-bg-emoji-1">🍓</div>
      <div className="chatbot-bg-emoji chatbot-bg-emoji-2">🥛</div>
    </div>
  );
};

export default ChatbotPage;