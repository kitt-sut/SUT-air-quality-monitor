/**
 * Frontend client สำหรับเรียก /api/chat (Vercel serverless proxy)
 * — ไม่ติดต่อ Gemini ตรง เพื่อไม่ให้ API key หลุดมาฝั่ง browser
 * — รองรับ AbortSignal เพื่อ cancel request กลางคันได้
 */

// อนุญาตให้ override endpoint ผ่าน env (ใช้ตอน dev หรือ deploy แยก backend)
const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_API_URL || '/api/chat';

/**
 * @param {string} message       ข้อความล่าสุดของผู้ใช้
 * @param {Array}  history       ประวัติแชท [{ sender:'user'|'ai', text }]
 * @param {Object} context       บริบทเสริม เช่น { libraryPM25, learningPM25 }
 * @param {AbortSignal} signal   ใช้ cancel request
 * @returns {Promise<string>}    ข้อความตอบจาก AI
 */
export async function askGemini(message, history = [], context = {}, signal) {
  // ส่งเฉพาะ field ที่ backend ใช้ ลดขนาด payload
  const slimHistory = history.map((m) => ({ sender: m.sender, text: m.text }));

  const res = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: slimHistory, context }),
    signal,
  });

  // อ่าน body ครั้งเดียว แล้วค่อยตัดสินใจตาม status
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Chat API error: HTTP ${res.status}`);
  }
  if (!data?.reply) {
    throw new Error('Chat API returned no reply');
  }
  return data.reply;
}
