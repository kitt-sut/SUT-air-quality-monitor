/**
 * Vercel Serverless Function — Gemini 2.5 Flash-Lite proxy
 * Endpoint: POST /api/chat
 *
 * รับข้อความจาก frontend → ส่งต่อให้ Gemini API → ส่งกลับเฉพาะข้อความที่ตอบ
 * วัตถุประสงค์หลัก: ซ่อน GEMINI_API_KEY ไม่ให้หลุดไป client bundle
 */

const MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT_BASE = `คุณคือผู้ช่วย AI ของระบบ "SUT Air Quality"
ที่ติดตามค่าฝุ่น PM2.5 ของมหาวิทยาลัยเทคโนโลยีสุรนารี (มทส.)

แนวทางการตอบ:
- ตอบเป็นภาษาไทย สุภาพ กระชับ
- ใช้อิโมจิเล็กน้อยเพื่อความเป็นมิตร
- ถ้ามีข้อมูลเซนเซอร์ล่าสุด ให้อ้างอิงค่าจริงเสมอ ไม่เดา
- ถ้าผู้ใช้ถามเรื่องนอกเหนือคุณภาพอากาศ ให้บอกอย่างสุภาพว่าตอบได้เฉพาะเรื่องคุณภาพอากาศ
- เกณฑ์ PM2.5 ประเทศไทย (กรมควบคุมมลพิษ): 0-15 ดีมาก, 15.1-25 ดี, 25.1-37.5 ปานกลาง, 37.6-75 เริ่มมีผลกระทบ, >75 มีผลกระทบต่อสุขภาพ`;

function buildSystemPrompt(context) {
  const ctx = formatContext(context);
  return ctx ? `${SYSTEM_PROMPT_BASE}\n\n${ctx}` : SYSTEM_PROMPT_BASE;
}

function formatContext({ libraryPM25, learningPM25 } = {}) {
  const lines = ['ข้อมูล PM2.5 ล่าสุดจากเซนเซอร์:'];
  if (typeof libraryPM25 === 'number') lines.push(`- อาคารบรรณสาร: ${libraryPM25} µg/m³`);
  if (typeof learningPM25 === 'number') lines.push(`- อาคารเรียนรวม 1: ${learningPM25} µg/m³`);
  return lines.length > 1 ? lines.join('\n') : '';
}

export default async function handler(req, res) {
  // Method check
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
  }

  // อ่าน body (Vercel parse JSON ให้แล้ว แต่กันกรณี string)
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { message, history = [], context = {} } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  // จำกัดประวัติให้สั้น (กัน token เยอะเกินไป + เร็วขึ้น)
  const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];

  const contents = [
    ...trimmedHistory
      .filter((m) => m && typeof m.text === 'string')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      })),
    { role: 'user', parts: [{ text: message.trim() }] },
  ];

  const payload = {
    systemInstruction: {
      parts: [{ text: buildSystemPrompt(context) }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 512,
    },
    safetySettings: [
      // ปล่อย default ของ Gemini ก็ปลอดภัยพอแล้วสำหรับ use case นี้
    ],
  };

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const detail = data?.error?.message || `HTTP ${geminiRes.status}`;
      console.error('[api/chat] Gemini error:', detail);
      return res.status(geminiRes.status).json({ error: detail });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) {
      console.error('[api/chat] empty response:', JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: 'AI returned no text' });
    }

    // cache header แบบเบาๆ (ไม่จำเป็น แต่ไว้กรณี edge cache)
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('[api/chat] fatal:', err);
    return res.status(500).json({ error: 'Internal error contacting Gemini' });
  }
}
