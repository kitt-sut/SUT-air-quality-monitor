import { memo } from 'react';

const formatTime = (date) =>
  date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

/**
 * ฟองข้อความเดียวใน chat - ใช้ร่วมกันระหว่าง ChatWindow (modal) และ ChatPage (full page)
 * - size="sm" สำหรับ modal, size="md" สำหรับหน้าเต็ม
 * - memo เพื่อกัน re-render ทุกครั้งที่มี message ใหม่เข้ามา
 */
function MessageBubble({ message, size = 'sm' }) {
  const isUser = message.sender === 'user';
  const isCompact = size === 'sm';

  const bubbleSizing = isCompact ? 'max-w-xs px-4 py-3' : 'max-w-md px-5 py-4';
  const userBg = isCompact
    ? 'bg-green-500 shadow-sm'
    : 'bg-gradient-to-br from-green-400 to-green-500 shadow-md';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`${bubbleSizing} rounded-2xl shadow-sm
                    ${isUser
                      ? `text-white rounded-br-none ${userBg}`
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </p>
        <p className={`text-xs mt-1 ${isUser ? 'text-green-100' : 'text-gray-500'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
