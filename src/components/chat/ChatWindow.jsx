import { useEffect, useRef } from 'react';
import useChat from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { IconClose, IconSend } from '../Icons';

/**
 * หน้าต่างแชทแบบ Modal ลอย — ใช้คู่กับ ChatButton
 * - Autofocus ที่ช่อง input ตอนเปิด
 * - กด ESC เพื่อปิด
 * - Auto scroll ลงล่างเมื่อมีข้อความใหม่ / กำลังพิมพ์
 *
 * @param {Object} props
 * @param {Function} props.onClose
 * @param {Object}   props.sensorContext - { libraryPM25, learningPM25 } เพื่อให้ AI ตอบรู้ค่าจริง
 */
export default function ChatWindow({ onClose, sensorContext }) {
  const { messages, input, setInput, isLoading, sendMessage } = useChat({ sensorContext });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll เฉพาะตอนข้อความเปลี่ยน / typing เพื่อไม่ scroll พร่ำเพรื่อ
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  // Focus ช่องพิมพ์ตอนเปิด + ผูก ESC เพื่อปิด modal
  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="หน้าต่างแชท AI"
      className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]
                 bg-white rounded-2xl shadow-2xl
                 flex flex-col h-[600px] max-h-[calc(100vh-7rem)]
                 overflow-hidden animate-fade-in"
    >
      {/* Header */}
      <header
        className="bg-gradient-to-r from-blue-500 to-blue-600
                   text-white px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 bg-white rounded-full
                       flex items-center justify-center text-blue-500
                       font-bold text-lg"
            aria-hidden="true"
          >
            🤖
          </div>
          <div>
            <h3 className="font-semibold text-lg">SUT Air Chat</h3>
            <p className="text-sm text-blue-100">ออนไลน์ - ตอบสนองทันที</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดแชท"
          className="text-white hover:bg-blue-700 p-2 rounded-lg
                     transition-colors focus:outline-none
                     focus:ring-2 focus:ring-white"
        >
          <IconClose className="w-6 h-6" />
        </button>
      </header>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label="ข้อความในแชท"
        className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} size="sm" />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="border-t border-gray-200 p-4 bg-white flex gap-2 items-center"
      >
        <label htmlFor="chat-window-input" className="sr-only">
          พิมพ์ข้อความถึง AI
        </label>
        <input
          id="chat-window-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-3
                     border-2 border-transparent
                     focus:outline-none focus:border-blue-500
                     transition-colors text-sm
                     placeholder-gray-500"
          disabled={isLoading}
          autoComplete="off"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="ส่งข้อความ"
          className="bg-green-500 hover:bg-green-600
                     disabled:bg-gray-300 disabled:cursor-not-allowed
                     text-white rounded-full w-10 h-10 flex-shrink-0
                     flex items-center justify-center
                     transition-colors shadow-md hover:shadow-lg
                     focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <IconSend className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
