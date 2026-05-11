import { useEffect, useRef } from 'react';
import useChat from '../hooks/useChat';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import { IconSend } from '../components/Icons';

/**
 * หน้า Chat แบบเต็มหน้า — เหมาะกับการใช้เป็น standalone route
 * (โครงสร้าง state เหมือน ChatWindow ทุกประการ แต่ layout ขยายให้เต็มหน้า)
 */
export default function ChatPage() {
  const { messages, input, setInput, isLoading, sendMessage } = useChat();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6">
      <div className="max-w-2xl mx-auto h-[calc(100vh-3rem)] flex flex-col px-4">
        {/* Header */}
        <header
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white
                     rounded-t-3xl px-6 py-6 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 bg-white/20 rounded-full
                         flex items-center justify-center text-2xl"
              aria-hidden="true"
            >
              🤖
            </div>
            <div>
              <h1 className="text-2xl font-bold">SUT Air Quality Chat</h1>
              <p className="text-blue-100">ระบบแชท AI ช่วยเหลือคุณภาพอากาศ</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div
          role="log"
          aria-live="polite"
          aria-label="ข้อความในแชท"
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-white border-x-2 border-gray-200"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} size="md" />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className="bg-white border-x-2 border-b-2 border-gray-200
                     rounded-b-3xl p-4 flex gap-3 items-center shadow-lg"
        >
          <label htmlFor="chat-page-input" className="sr-only">
            พิมพ์ข้อความถึง AI
          </label>
          <input
            id="chat-page-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความของคุณที่นี่..."
            className="flex-1 bg-gray-100 rounded-full px-5 py-3
                       border-2 border-transparent
                       focus:outline-none focus:border-blue-500
                       focus:bg-white transition-all text-sm
                       placeholder-gray-500"
            disabled={isLoading}
            autoComplete="off"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="ส่งข้อความ"
            className="bg-gradient-to-r from-green-500 to-green-600
                       hover:from-green-600 hover:to-green-700
                       disabled:from-gray-300 disabled:to-gray-400
                       disabled:cursor-not-allowed
                       text-white rounded-full w-12 h-12 flex-shrink-0
                       flex items-center justify-center
                       transition-all shadow-md hover:shadow-lg
                       focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <IconSend className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
