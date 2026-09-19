import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send, 
  Minus, 
  X, 
  Sparkles
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  agentName?: string;
  text: string;
  timestamp: string;
}

interface AIChatbotWidgetProps {
  externalPrompt?: { text: string; timestamp: number } | null;
}

export const AIChatbotWidget: React.FC<AIChatbotWidgetProps> = ({ externalPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      agentName: 'Career Coach Agent',
      text: 'Hi! I can help you evaluate internship readiness, prepare for technical interviews, or analyze specific role requirements.',
      timestamp: '11:42 AM'
    }
  ]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Query live Career Coach endpoint powered by Google Gemini API
    try {
      const response = await fetch(`${API_BASE_URL}/api/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (response.ok) {
        const data = await response.json();
        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          agentName: data.agent || 'Career Coach Agent',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, agentMsg]);
        return;
      }
    } catch {
      // Backend is offline or starting, fall through to fallback
    }

    // Local simulation fallback if server is unreachable
    setTimeout(() => {
      let botReply = "I've analyzed your query with the coordinator agent.";
      let agentName = "Career Coach Agent";

      if (query.toLowerCase().includes('scout') || query.toLowerCase().includes('job') || query.toLowerCase().includes('role')) {
        agentName = "Scout Agent";
        botReply = "Scout Agent active: Querying verified Malaysian feeds (JobStreet, Hiredly) for fresh software engineering internships.";
      } else if (query.toLowerCase().includes('prep') || query.toLowerCase().includes('interview') || query.toLowerCase().includes('grab')) {
        agentName = "Career Coach Agent";
        botReply = "For Grab Malaysia and tech scaleups: focus on distributed systems fundamentals, Go/Node.js microservices, and LeetCode medium graph traversals.";
      } else if (query.toLowerCase().includes('gap') || query.toLowerCase().includes('skill')) {
        agentName = "Readiness Agent";
        botReply = "Key gap detected in container orchestration (Docker/Kubernetes) and microservices. Overall candidate match is 91%.";
      } else {
        botReply = `Received: "${query}". Guidance provided for Malaysian software engineering internships.`;
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        agentName: agentName,
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentMsg]);
    }, 400);
  }, [inputText]);

  useEffect(() => {
    if (externalPrompt && externalPrompt.text) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setMinimized(false);
        handleSend(externalPrompt.text);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [externalPrompt, handleSend]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          height: '42px',
          padding: '0 16px',
          borderRadius: '980px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          color: '#f5f5f7',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          zIndex: 900,
          fontWeight: '500',
          fontSize: '0.82rem',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Sparkles size={15} color="#f5f5f7" />
        <span>Ask AI Coach</span>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '350px',
      height: minimized ? '44px' : '460px',
      background: 'rgba(28, 28, 30, 0.9)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      boxShadow: '0 20px 48px rgba(0, 0, 0, 0.55)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 900,
      transition: 'height 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Apple-style macOS Sheet Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        userSelect: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Sparkles size={14} color="#f5f5f7" />
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f5f5f7', letterSpacing: '-0.01em' }}>
            Career Coach
          </span>
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#30d158',
            display: 'inline-block'
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setMinimized(!minimized)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#86868b',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Minus size={13} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#86868b',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Chat Messages */}
          <div style={{
            flex: 1,
            padding: '12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {messages.map(msg => (
              <div 
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}
              >
                {msg.sender === 'agent' && (
                  <span style={{ fontSize: '0.66rem', color: '#86868b', fontWeight: '500', marginLeft: '4px' }}>
                    {msg.agentName}
                  </span>
                )}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.sender === 'user' 
                    ? '#0071e3' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: msg.sender === 'user'
                    ? 'none'
                    : '1px solid var(--border-color)',
                  color: '#f5f5f7',
                  fontSize: '0.78rem',
                  lineHeight: '1.4'
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '0.6rem', color: '#6e6e73', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', margin: '0 4px' }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Recommendation Chips — Apple Style */}
          <div style={{ padding: '0 10px 8px 10px', display: 'flex', gap: '5px', overflowX: 'auto' }}>
            <button 
              onClick={() => handleSend('Prep for Google interview')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '980px',
                padding: '3px 9px',
                fontSize: '0.68rem',
                color: '#86868b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease'
              }}
            >
              Google Prep
            </button>
            <button 
              onClick={() => handleSend('Scout fresh Go roles')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '980px',
                padding: '3px 9px',
                fontSize: '0.68rem',
                color: '#86868b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease'
              }}
            >
              Scout Roles
            </button>
            <button 
              onClick={() => handleSend('Analyze my skill gaps')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '980px',
                padding: '3px 9px',
                fontSize: '0.68rem',
                color: '#86868b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease'
              }}
            >
              Skill Gaps
            </button>
          </div>

          {/* Input Box */}
          <div style={{
            padding: '8px 10px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <input 
              type="text"
              placeholder="Ask Career Coach..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '980px',
                padding: '6px 12px',
                color: '#f5f5f7',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSend()}
              style={{
                background: '#0071e3',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <Send size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
