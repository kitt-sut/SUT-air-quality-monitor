import { useCallback, useEffect, useRef, useState } from 'react';
import { askGemini } from '../services/geminiService';

/**
 * Shared chat state ที่ใช้ทั้ง ChatWindow (modal) และ ChatPage (full page)
 * - เรียก Gemini 2.5 Flash-Lite ผ่าน /api/chat (proxy)
 * - cancel request เก่าอัตโนมัติเมื่อมีการส่งใหม่ / unmount
 * - แสดงข้อความ error เป็นข้อความ AI หนึ่งบรรทัด เพื่อไม่ทำลาย UX
 *
 * @param {Object} options
 * @param {Object} options.sensorContext - { libraryPM25, learningPM25 } ส่งให้ AI เพื่อให้ตอบมี context
 */

const INITIAL_MESSAGE = Object.freeze({
  id: 'welcome',
  text: 'สวัสดี! 👋 ฉันคือผู้ช่วย AI เรื่องคุณภาพอากาศของอาคารใน มทส. ถามอะไรเกี่ยวกับ PM2.5 ได้เลยนะ',
  sender: 'ai',
  timestamp: new Date(),
});

const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const FALLBACK_ERROR_TEXT =
  '⚠️ ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ AI ลองใหม่อีกครั้ง';

export default function useChat({ sensorContext } = {}) {
  const [messages, setMessages] = useState(() => [INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  // เก็บ sensorContext ล่าสุดใน ref เพื่อไม่ให้ sendMessage ต้อง re-create
  // ทุกครั้งที่ค่า sensor เปลี่ยน (sensor refresh ทุก 5 นาที)
  const sensorRef = useRef(sensorContext);
  useEffect(() => {
    sensorRef.current = sensorContext;
  }, [sensorContext]);

  // Cleanup: abort request ที่ค้าง + ปิด flag mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const text = input.trim();
      if (!text || isLoading) return;

      const userMessage = {
        id: makeId(),
        text,
        sender: 'user',
        timestamp: new Date(),
      };

      // ใช้ snapshot ของข้อความ "ก่อน" push เพื่อเอาไปทำ history สำหรับ Gemini
      // (ไม่รวม userMessage ใหม่ เพราะส่งแยกเป็น field `message`)
      const historyForApi = messages;

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      setError(null);

      // ยกเลิก request เก่าถ้ายังค้างอยู่ — ป้องกัน race condition
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const reply = await askGemini(
          text,
          historyForApi,
          sensorRef.current ?? {},
          abortRef.current.signal
        );

        if (!mountedRef.current) return;

        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            text: reply,
            sender: 'ai',
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        // ผู้ใช้ส่งใหม่ระหว่างที่อันก่อนยังไม่เสร็จ — ไม่ต้องโชว์ error
        if (err.name === 'AbortError') return;
        if (!mountedRef.current) return;

        console.error('[useChat] sendMessage failed:', err);
        setError(err.message);
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            text: FALLBACK_ERROR_TEXT,
            sender: 'ai',
            timestamp: new Date(),
          },
        ]);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [input, isLoading, messages]
  );

  return { messages, input, setInput, isLoading, error, sendMessage };
}
