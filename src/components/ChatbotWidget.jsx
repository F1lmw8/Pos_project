'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import drugData from '../data/drugs.json';
import { getRduDetails } from '../utils/rduMatcher';
import { mapThaiToEnglishGeneric, findDrugFromThaiMatch, getBotResponse } from '../utils/safetyEngine';

export default function ChatbotWidget() {
  const renderMessageText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      let currentLine = line;
      
      // If line is empty or just spaces
      if (!currentLine.trim()) {
        return <div key={lineIdx} className="rdu-chat-spacer" style={{ height: '8px' }} />;
      }
      
      const isBlockquote = currentLine.trim().startsWith('>');
      if (isBlockquote) {
        currentLine = currentLine.trim().substring(1).trim();
      }
      
      const isBullet = currentLine.trim().startsWith('•') || currentLine.trim().startsWith('-');
      if (isBullet) {
        currentLine = currentLine.trim().replace(/^[•-]\s*/, '');
      }
      
      // Find bold tags
      const parts = [];
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(currentLine)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          parts.push(currentLine.substring(lastIndex, matchIndex));
        }
        parts.push(<strong key={`bold-${matchIndex}`} className="font-semibold text-teal-800">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < currentLine.length) {
        parts.push(currentLine.substring(lastIndex));
      }
      
      const content = parts.length > 0 ? parts : currentLine;
      
      if (isBlockquote) {
        return (
          <blockquote key={lineIdx} className="rdu-chat-blockquote">
            {content}
          </blockquote>
        );
      }
      
      if (isBullet) {
        return (
          <li key={lineIdx} className="rdu-chat-bullet">
            {content}
          </li>
        );
      }
      
      return (
        <div key={lineIdx} className="rdu-chat-line">
          {content}
        </div>
      );
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const [drugContext, setDrugContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasPulse, setHasPulse] = useState(true);

  const pathname = usePathname();
  const messagesEndRef = useRef(null);

  // 1. ตรวจจับการเปลี่ยนแปลงของตำแหน่ง URL เพื่อดึงบริบทยาโดยอัตโนมัติ (Context-Aware path detection)
  useEffect(() => {
    if (pathname && pathname.startsWith('/drug/')) {
      const id = pathname.split('/').pop();
      const activeDrug = drugData.find(d => d.c === id);
      if (activeDrug) {
        setDrugContext(activeDrug);
        // แสดงการทักทายต้อนรับเกี่ยวกับยาตัวนี้เมื่อสลับหน้ารายละเอียด
        addBotGreeting(activeDrug);
        return;
      }
    } else {
      // เคลียร์บริบทยาเมื่อออกจากหน้ารายละเอียด ยกเว้นว่าจะเปิดใช้งาน Modal บนหน้าหลัก
      setDrugContext(null);
    }
  }, [pathname]);

  // 2. รับฟัง Custom Event เผื่อมี Modal ข้อมูลเปิดขึ้นมาในหน้าแรก
  useEffect(() => {
    const handleDrugChange = (e) => {
      if (e.detail) {
        setDrugContext(e.detail);
        addBotGreeting(e.detail);
      } else {
        // หากอยู่นอกหน้ารายละเอียดเฉพาะ ให้เคลียร์บริบท
        if (pathname && !pathname.startsWith('/drug/')) {
          setDrugContext(null);
        }
      }
    };
    window.addEventListener('active-drug-changed', handleDrugChange);
    return () => {
      window.removeEventListener('active-drug-changed', handleDrugChange);
    };
  }, [pathname]);

  // ลื่นไหลลงด้านล่างเมื่อมีข้อความใหม่
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // ตั้งค่าข้อความทักทายแรกสุด
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'สวัสดีครับ! ยินดีต้อนรับสู่ RDU Smart AI Assistant! 🩺🤖 ผมคือเภสัชกรอัจฉริยะประเมินความปลอดภัยในการใช้ยาและรหัสยามาตรฐานแห่งชาติ TMT ครับ',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'welcome-2',
        sender: 'bot',
        text: 'คุณสามารถถามข้อมูลเรื่องยาได้เลยครับ เช่น "ลืมกินยาต้องทำอย่างไร" หรือคลิกเลือกคำถามแนะนำด้านล่างได้เลยครับ!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // ฟังก์ชันแสดงคำต้อนรับเฉพาะยา
  const addBotGreeting = (drug) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `greeting-${Date.now()}`,
        sender: 'bot',
        text: `💡 **ตรวจพบข้อมูลยา:** ผมเห็นว่าคุณกำลังดูข้อมูลของ **"${drug.t}"** (${drug.a}) อยู่ 💊\nมีเรื่องไหนที่คุณต้องการสอบถามความปลอดภัยเป็นพิเศษไหมครับ? เช่น ทานคู่กับกาแฟได้ไหม หรือสตรีมีครรภ์ทานได้ไหม?`,
        time: timeStr
      }
    ]);
    // กระตุ้นให้ปุ่ม FAB มีแจ้งเตือนกะพริบเรียกร้องความสนใจเมื่อสลับบริบท
    setHasPulse(true);
  };

  // ดึงคำถามแนะนำตามบริบทยาปัจจุบัน
  const suggestedQuestions = useMemo(() => {
    if (drugContext) {
      const name = drugContext.t.split(' ')[0];
      return [
        { text: `คนท้องกิน ${name} ได้ไหม?`, type: 'pregnancy' },
        { text: `กิน ${name} กับกาแฟได้ไหม?`, type: 'coffee' },
        { text: `วิธีทานยา ${name} ที่ถูกต้อง`, type: 'usage' },
        { text: `ผลข้างเคียงของยา ${name}`, type: 'sideeffect' }
      ];
    } else {
      return [
        { text: 'ยาปฏิชีวนะ ต่างจาก ยาแก้อักเสบ อย่างไร?', type: 'diff' },
        { text: 'ลืมกินยาควรปฏิบัติตัวอย่างไร?', type: 'forget' },
        { text: 'ยาแบบไหนที่คนท้องต้องห้ามกิน?', type: 'pregnancy_general' },
        { text: 'ทำไมยาบางตัวต้องกินหลังอาหารทันที?', type: 'after_meal' }
      ];
    }
  }, [drugContext]);

  // ดำเนินการยิงคำถาม
  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;
    
    // 1. เพิ่มข้อความของผู้ใช้ลงไปใน Chat
    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text: text, time: timeStr }
    ]);
    setInputValue('');
    setIsTyping(true);

    // 2. ตรวจจับคีย์เวิร์ดยาในประโยคโดยอัตโนมัติ (Smart Drug Lookup on the fly!)
    const query = text.toLowerCase();
    let foundDrug = null;
    
    // 2.1 ใช้ Thai Phonetic Mapper ก่อน
    const thaiMatches = mapThaiToEnglishGeneric(query);
    if (thaiMatches.length > 0) {
      foundDrug = findDrugFromThaiMatch(thaiMatches);
    }
    
    // 2.2 ค้นหาด่วนตามแบรนด์หรือสารสำคัญดั้งเดิมถ้าไม่เจอจากข้อแรก
    if (!foundDrug) {
      const popularNames = ['paracetamol', 'amoxicillin', 'ibuprofen', 'atorvastatin', 'metformin', 'omeprazole', 'clobetasol'];
      for (const name of popularNames) {
        if (query.includes(name)) {
          foundDrug = drugData.find(d => d.a && d.a.toLowerCase().includes(name));
          break;
        }
      }
    }

    if (!foundDrug) {
      const match = drugData.find(d => 
        (d.t && query.includes(d.t.toLowerCase())) || 
        (d.a && query.includes(d.a.toLowerCase()))
      );
      if (match) {
        foundDrug = match;
      }
    }

    // จำลองอนิเมชันบอตกำลังคิด (Typing Indicator) 850ms
    setTimeout(() => {
      let activeContext = drugContext;
      let prependSystemText = '';

      if (foundDrug && (!drugContext || drugContext.c !== foundDrug.c)) {
        activeContext = foundDrug;
        setDrugContext(foundDrug);
        prependSystemText = `🔄 *สลับไปยังบริบทของยาใหม่ที่คุณเอ่ยถึง: **"${foundDrug.t}"** (${foundDrug.a}) เรียบร้อยครับ*\n\n`;
      }

      const botAnswerText = getBotResponse(text, activeContext);
      
      setMessages(prev => [
        ...prev,
        { 
          id: `bot-${Date.now()}`, 
          sender: 'bot', 
          text: prependSystemText + botAnswerText, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
      setIsTyping(false);
      setHasPulse(false); // เคลียร์แจ้งเตือนเมื่อเปิดคุยแล้ว
    }, 850);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  const clearContext = () => {
    setDrugContext(null);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `clear-${Date.now()}`,
        sender: 'bot',
        text: '🧹 *ทำความสะอาดบริบทเสร็จสิ้นแล้วครับ!* ผมได้เคลียร์บริบทยาตัวก่อนหน้าลงแล้ว ตอนนี้เราสามารถพูดคุยเรื่องยาหรือความปลอดภัยทั่วไปได้เลยครับ',
        time: timeStr
      }
    ]);
  };

  return (
    <>
      {/* 1. ปุ่มลอย Floating Action Button (FAB) ขวาล่าง */}
      <button 
        className={`rdu-chatbot-fab ${isOpen ? 'active' : ''} ${hasPulse && !isOpen ? 'pulse-alert' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setHasPulse(false);
        }}
        aria-label="เปิดเภสัชกรอัจฉริยะ RDU"
        title="คุยกับเภสัชกรอัจฉริยะ RDU"
      >
        {isOpen ? (
          // ไอคอนกากบาทสีขาวเมื่อเปิดแชตอยู่
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          // ไอคอนบอตอัจฉริยะทรงกระดิ่ง/สเตสโตสโคป/เม็ดยา
          <div className="fab-icon-wrapper">
            <span className="fab-bot-emoji">🩺</span>
            <span className="fab-glow-ring"></span>
          </div>
        )}
      </button>

      {/* 2. หน้าต่างบานแชตหลัก Chat Window Container */}
      <div className={`rdu-chatbot-container ${isOpen ? 'open' : ''}`}>
        
        {/* แถบหัวขวาบน Header */}
        <div className="chatbot-header">
          <div className="header-bot-info">
            <div className="bot-avatar-wrapper">
              <span className="bot-avatar-emoji">🤖</span>
              <span className="online-indicator"></span>
            </div>
            <div>
              <h4 className="header-bot-name">เภสัชกรอัจฉริยะ RDU AI</h4>
              <p className="header-bot-status">ออนไลน์อยู่ • ปรึกษาความปลอดภัยยา</p>
            </div>
          </div>
          <button 
            className="header-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="ย่อหน้าต่าง"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>

        {/* แถบบริบทยาที่กำลังโฟกัสอยู่ (Active Drug Banner) */}
        {drugContext && (
          <div className="chatbot-context-banner">
            <div className="context-pill">
              <span className="context-icon">💊</span>
              <span className="context-text" title={`${drugContext.t} (${drugContext.a})`}>
                ยาในโฟกัส: <strong>{drugContext.t.split(' ')[0]}</strong>
              </span>
            </div>
            <button 
              className="context-clear-btn"
              onClick={clearContext}
              title="ล้างบริบทยาตัวนี้"
            >
              ล้าง ❌
            </button>
          </div>
        )}

        {/* ส่วนแสดงประวัติการคุย (Message History List) */}
        <div className="chatbot-messages-area">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`chat-message-bubble-wrapper ${msg.sender === 'user' ? 'user-side' : 'bot-side'}`}
            >
              {msg.sender === 'bot' && (
                <div className="message-bot-avatar">🤖</div>
              )}
              <div className="message-bubble-inner">
                <div className="message-text">
                  {renderMessageText(msg.text)}
                </div>
                <span className="message-timestamp">{msg.time}</span>
              </div>
            </div>
          ))}

          {/* อนิเมชันจำลองบอตกำลังประมวลผล (Typing Indicator) */}
          {isTyping && (
            <div className="chat-message-bubble-wrapper bot-side">
              <div className="message-bot-avatar">🤖</div>
              <div className="message-bubble-inner typing-dots-bubble">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* กล่องหัวข้อคำถามแนะนำด้านล่าง (Suggested Questions Widget) */}
        <div className="chatbot-suggestions-section">
          <p className="suggestions-label">💡 คำถามแนะนำหัวข้อเรื่องยา:</p>
          <div className="suggestions-scroll-wrapper">
            {suggestedQuestions.map((q, idx) => (
              <button 
                key={idx}
                className="suggestion-tag-btn"
                onClick={() => handleSendMessage(q.text)}
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>

        {/* กล่องสำหรับพิมพ์ข้อความส่งด้านล่างสุด Input Bar */}
        <div className="chatbot-input-bar">
          <input 
            type="text"
            className="chatbot-text-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={drugContext ? `ถามเกี่ยวกับยา ${drugContext.t.split(' ')[0]}...` : "ถามคำถามเรื่องยาที่นี่..."}
            disabled={isTyping}
          />
          <button 
            className={`chatbot-send-btn ${inputValue.trim() ? 'active' : ''}`}
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            aria-label="ส่งข้อความ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>

      </div>
    </>
  );
}
