const DELAYS = [0, 0.2, 0.4];

/**
 * ตัวบ่งบอกว่า AI กำลังพิมพ์อยู่ — สามจุดเด้งสลับกัน
 */
export default function TypingIndicator() {
  return (
    <div
      className="flex justify-start animate-fade-in"
      aria-live="polite"
      aria-label="กำลังพิมพ์"
    >
      <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
        <div className="flex gap-1">
          {DELAYS.map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
