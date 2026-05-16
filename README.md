# SUT Air Quality Monitoring

เว็บแอปพลิเคชันสำหรับติดตามและรายงานคุณภาพอากาศ (ค่าฝุ่น PM 2.5) ภายในมหาวิทยาลัยเทคโนโลยีสุรนารี (SUT) แบบ Real-time แสดงผลข้อมูลจากเซนเซอร์ ESP32 ที่ติดตั้งตามจุดต่าง ๆ พร้อมแปลงเป็นระดับคุณภาพอากาศ (AQI) ตามมาตรฐานของกรมควบคุมมลพิษประเทศไทย และมีผู้ช่วย AI (Gemini) ที่ตอบคำถามเรื่องคุณภาพอากาศโดยอ้างอิงค่าจริงจากเซนเซอร์

## สารบัญ

- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [สถาปัตยกรรม](#สถาปัตยกรรม)
- [โครงสร้างโปรเจ็กต์](#โครงสร้างโปรเจ็กต์)
- [การติดตั้งและใช้งาน](#การติดตั้งและใช้งาน)
- [Environment Variables](#environment-variables)
- [การตั้งค่า](#การตั้งค่า)
- [การ Deploy](#การ-deploy)
- [แหล่งที่มาของข้อมูล](#แหล่งที่มาของข้อมูล)
- [เกณฑ์คุณภาพอากาศ](#เกณฑ์คุณภาพอากาศ)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)
- [License](#license)

## ฟีเจอร์หลัก

- **Real-time Monitoring** — ดึงค่า PM 2.5 ล่าสุดมาแสดงผลและอัปเดตอัตโนมัติทุก 5 นาที โดยใช้ recursive `setTimeout` เพื่อกัน fetch ซ้อนกันในกรณีที่เครือข่ายช้า
- **AQI Standard** — แปลงค่า PM 2.5 เป็นระดับคุณภาพอากาศพร้อมคำแนะนำในการปฏิบัติตัว ตามเกณฑ์ของกรมควบคุมมลพิษ (มิ.ย. 2566)
- **Stale Data Fallback** — เมื่อเซนเซอร์ออฟไลน์หรือดึงข้อมูลไม่สำเร็จ ระบบจะยังคงแสดงค่าล่าสุดที่ดึงได้สำเร็จ พร้อม badge บอกว่าเป็นข้อมูลเก่ากี่นาที/ชั่วโมงที่แล้ว
- **Google Sheets Integration** — ดึงข้อมูลจาก Google Sheets ที่บันทึกจาก ESP32 ผ่าน Google Visualization API โดยใช้ query แบบ SQL เพื่อโหลดเฉพาะข้อมูลล่าสุด ลดขนาด payload จากหลาย MB เหลือไม่กี่ Byte
- **AI Chat Assistant** — ผู้ช่วย AI ที่ใช้ **Gemini 2.5 Flash-Lite** ตอบคำถามเกี่ยวกับคุณภาพอากาศ โดยรับ context ค่า PM 2.5 ล่าสุดของแต่ละจุดเป็นข้อมูลอ้างอิง (ผ่าน Vercel Serverless Function เพื่อซ่อน API key)
- **Responsive Design** — แสดงผลได้สวยงามทั้งบนมือถือ แท็บเล็ต และเดสก์ท็อป
- **Graceful Error Handling** — ใช้ AbortController ยกเลิก fetch ซ้อนกัน และมี state machine แยก loading/data/stale/error ของแต่ละการ์ด
- **Animation** — มี CountUp animation ของตัวเลข PM 2.5 (easeOutCubic) ที่ต่อเนื่องจากค่าก่อนหน้า ไม่ reset กลับ 0 ทุกครั้ง

## เทคโนโลยีที่ใช้

| ประเภท | เครื่องมือ |
|--------|-----------|
| Framework | [React 18](https://react.dev/) |
| Build Tool | [Vite 5](https://vitejs.dev/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Data Source | [Google Visualization API](https://developers.google.com/chart/interactive/docs/dev/api) |
| AI Backend | [Gemini 2.5 Flash-Lite](https://ai.google.dev/) (ผ่าน Vercel Serverless Function) |
| Deployment | [Vercel](https://vercel.com/) (Frontend + Serverless API) |
| Font | Sarabun (Google Fonts) |

## สถาปัตยกรรม

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────────┐
│   Browser    │─────▶│  Google Sheets  │      │   ESP32 Sensors  │
│  (React App) │ ◀────│  (gviz/tq API)  │ ◀────│  (PM2.5 logger)  │
└──────┬───────┘      └─────────────────┘      └──────────────────┘
       │
       │ POST /api/chat (message + sensor context)
       ▼
┌──────────────────────┐      ┌────────────────────┐
│  Vercel Serverless   │─────▶│   Gemini API       │
│  Function (api/chat) │ ◀────│  (Flash-Lite 2.5)  │
└──────────────────────┘      └────────────────────┘
```

จุดสำคัญ:
- **PM 2.5** — Browser ดึงตรงจาก Google Sheets ผ่าน `gviz/tq` (ไม่ผ่าน backend) เพราะ Sheet ตั้ง public แล้ว
- **AI Chat** — Browser ส่งคำถามผ่าน Vercel Function `api/chat.js` เพื่อ proxy ไป Gemini (เก็บ `GEMINI_API_KEY` ไว้ฝั่ง server เท่านั้น ไม่หลุดมา client bundle)

## โครงสร้างโปรเจ็กต์

```
sut-air-quality/
├── .github/
│   └── workflows/
│       └── deploy.yml             # (deprecated) GitHub Pages workflow — ปิดไว้แล้ว
├── api/
│   └── chat.js                    # Vercel Serverless: proxy ไป Gemini API
├── public/
│   └── img/                       # รูปอาคารและ favicon (Library.jpg, LearningBuilding_1.jpg, my-icon.png)
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatButton.jsx     # ปุ่ม floating เปิด/ปิดหน้าต่างแชท
│   │   │   ├── ChatWindow.jsx     # หน้าต่างแชทหลัก
│   │   │   ├── MessageBubble.jsx  # bubble แสดงข้อความแต่ละข้อความ
│   │   │   ├── TypingIndicator.jsx# ดอท ๆ ตอน AI กำลังพิมพ์
│   │   │   └── index.js           # barrel export
│   │   ├── AQILegend.jsx          # แถบอธิบายเกณฑ์ AQI
│   │   ├── Icons.jsx              # SVG icons (inline)
│   │   └── LocationCard.jsx       # การ์ดแสดงค่าของแต่ละจุด
│   ├── config/
│   │   └── index.js               # ค่าคงที่ — LOCATIONS, SHEET_ID, FETCH_INTERVAL_MS, PM25_COL_INDEX
│   ├── hooks/
│   │   ├── useChat.js             # state machine ของหน้าต่างแชท (history, sending, error)
│   │   ├── useCountUp.js          # animate ตัวเลขจากค่าเก่าไปค่าใหม่
│   │   └── useSensorData.js       # จัดการการ fetch, polling, abort, state ของเซนเซอร์
│   ├── pages/
│   │   └── ChatPage.jsx           # หน้าแชทแบบเต็มจอ (สำรอง, ถ้าต้อง route แยก)
│   ├── services/
│   │   ├── geminiService.js       # client เรียก /api/chat (รองรับ AbortSignal)
│   │   └── sheetService.js        # ดึงและ parse ข้อมูลจาก Google Sheets
│   ├── utils/
│   │   └── aqi.js                 # แปลง PM2.5 เป็นข้อมูล AQI (สี, label, คำแนะนำ)
│   ├── App.jsx                    # Root component
│   ├── index.css                  # Tailwind + custom keyframes
│   └── main.jsx                   # Entry point
├── .env.example                   # ตัวอย่าง env variables
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json                    # ตั้งค่า Vercel (framework, function timeout)
└── vite.config.js
```

## การติดตั้งและใช้งาน

### Prerequisites

- Node.js 20 ขึ้นไป
- npm 10 ขึ้นไป
- Google Sheet ที่บันทึกข้อมูลจากเซนเซอร์ (ดูรายละเอียดในส่วน [แหล่งที่มาของข้อมูล](#แหล่งที่มาของข้อมูล))
- Gemini API key — ขอฟรีที่ [aistudio.google.com](https://aistudio.google.com/) (ใช้เฉพาะถ้าจะรันฟีเจอร์ Chat AI)
- (สำหรับรันฟีเจอร์แชทแบบ local) [Vercel CLI](https://vercel.com/docs/cli) — ติดตั้งด้วย `npm i -g vercel`

### 1. Clone repository

```bash
git clone https://github.com/kitt-sut/SUT-air-quality-monitor
cd SUT-air-quality-monitor
```

### 2. ติดตั้ง dependencies

```bash
npm install
```

### 3. ตั้งค่า environment variables

คัดลอกไฟล์ `.env.example` ไปเป็น `.env` แล้วใส่ค่าของคุณ

```bash
cp .env.example .env
```

```env
# ใช้ใน frontend — ดึงข้อมูลจาก Google Sheets
VITE_GOOGLE_SHEET_ID=ใส่_Sheet_ID_ของคุณตรงนี้

# ใช้ใน server-side เท่านั้น — ห้ามใส่ prefix VITE_ (จะหลุดมา client bundle)
GEMINI_API_KEY=ใส่_Gemini_API_key_ของคุณตรงนี้

# (ตัวเลือก) override endpoint ของ chat API
# - ถ้า deploy frontend + serverless ใน Vercel เดียวกัน ปล่อยว่างไว้ใช้ /api/chat อัตโนมัติ
# VITE_CHAT_API_URL=https://your-worker.workers.dev/api/chat
```

ดูรายละเอียดเพิ่มเติมที่หัวข้อ [Environment Variables](#environment-variables)

### 4. รัน development server

**สำหรับพัฒนา UI อย่างเดียว (ไม่ใช้ Chat AI):**

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:5173/`

**สำหรับพัฒนาพร้อม Chat AI (เรียก `/api/chat`):**

ใช้ Vercel CLI เพื่อรัน serverless function พร้อมกัน

```bash
vercel dev
```

เปิดเบราว์เซอร์ที่ URL ที่ Vercel CLI แสดง (มักเป็น `http://localhost:3000`)

> เหตุที่ต้องใช้ `vercel dev`: `npm run dev` ใช้ Vite อย่างเดียว ซึ่งไม่รู้จัก `api/chat.js` ดังนั้นการเรียก `/api/chat` จะได้ 404

### 5. Build สำหรับ production

```bash
npm run build
npm run preview     # ทดสอบ production build บนเครื่อง (frontend อย่างเดียว)
```

## Environment Variables

| ตัวแปร | ฝั่ง | จำเป็น | คำอธิบาย |
|-------|-----|--------|----------|
| `VITE_GOOGLE_SHEET_ID` | Client (frontend) | **จำเป็น** | Sheet ID ของ Google Sheet ที่เก็บข้อมูล PM 2.5 |
| `GEMINI_API_KEY` | Server (Vercel Function) | จำเป็นถ้าจะใช้ Chat AI | API key สำหรับเรียก Gemini — **ห้ามใส่ prefix `VITE_`** เพราะจะทำให้หลุดมา client bundle |
| `VITE_CHAT_API_URL` | Client | ตัวเลือก | ใช้ override endpoint ของ chat API กรณี deploy backend แยก เช่น Cloudflare Workers (ถ้าไม่ตั้ง จะใช้ `/api/chat` โดย default) |

**วิธีหา Sheet ID:** เปิด Google Sheet แล้วดู URL

```
https://docs.google.com/spreadsheets/d/【Sheet ID อยู่ตรงนี้】/edit
```

> หมายเหตุ: ใส่เฉพาะ Sheet ID เท่านั้น ไม่ใส่ URL เต็ม
>
> และ Google Sheet ต้องตั้งค่าการแชร์เป็น **"Anyone with the link"** (Viewer) ไม่อย่างนั้นการ fetch จะถูกตอบกลับเป็นหน้า login ของ Google แทน JSON

## การตั้งค่า

### เพิ่ม/แก้ไขจุดเซนเซอร์

แก้ที่ `src/config/index.js`

```js
export const LOCATIONS = [
  {
    id: 1,
    sensorId: 'ESP32_01',                    // ใช้เป็น key ใน sensorData และแสดงเป็น badge
    gid: '1098888062',                       // GID ของ tab ใน Google Sheet
    image: `${import.meta.env.BASE_URL}img/Library.jpg`,
    name: 'อาคารบรรณสาร (Library)',
    fallback: 'https://images.unsplash.com/…' // URL สำรองถ้ารูปหลักโหลดไม่ขึ้น
  },
  // …เพิ่มจุดอื่น ๆ ที่นี่
];
```

**วิธีหา GID:** เปิด Google Sheet แล้วคลิกแท็บที่ต้องการ ดูที่ URL ส่วน `gid=`

```
https://docs.google.com/spreadsheets/d/.../edit#gid=【GID อยู่ตรงนี้】
```

> ถ้าเพิ่มจุดเซนเซอร์ใหม่และต้องการให้ AI ตอบโดยอ้างอิงค่าจุดนั้นได้ด้วย ให้ส่ง `sensorContext` เพิ่มที่ `App.jsx` และอัปเดต `formatContext()` ใน `api/chat.js` ให้รู้จักจุดใหม่

### ปรับ interval การ fetch

```js
export const FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 นาที (ค่าเริ่มต้น)
```

### เปลี่ยนคอลัมน์ที่เก็บค่า PM 2.5

ถ้าใน Google Sheet ค่า PM 2.5 อยู่คอลัมน์อื่น (ไม่ใช่ E) แก้ที่:

```js
export const PM25_COL_INDEX = 4; // 0-based index (A=0, B=1, …, E=4)
```

แล้วแก้ตัวอักษรคอลัมน์ใน query ของ `src/services/sheetService.js` ด้วย

```js
'SELECT * WHERE E IS NOT NULL ORDER BY A DESC, B DESC LIMIT 1'
//                ^                    ^      ^
//          คอลัมน์ PM2.5      วันที่   เวลา (สำหรับ sort ล่าสุดก่อน)
```

### ปรับพฤติกรรมของ Chat AI

แก้ที่ `api/chat.js`

- **เปลี่ยนโมเดล:** แก้ค่า `MODEL` (เช่น `'gemini-2.5-flash'` ถ้าต้องการความแม่นยำกว่า แต่แพงกว่า)
- **ปรับ system prompt:** แก้ `SYSTEM_PROMPT_BASE` (ตอนนี้บังคับให้ตอบเป็นไทย ลงท้าย "ครับ" ห้ามใช้ emoji/markdown)
- **ปรับ context ที่ส่งให้ AI:** แก้ `formatContext()` ให้รับ field ใหม่ตามจุดเซนเซอร์ที่เพิ่มเข้ามา
- **ปรับความยาว/ความสร้างสรรค์:** แก้ `temperature`, `maxOutputTokens` ใน `generationConfig`
- **ปรับจำนวนข้อความประวัติที่ส่งให้ AI:** แก้ `history.slice(-6)` (ค่าเริ่มต้น 6 ข้อความล่าสุด)

## การ Deploy

โปรเจ็กต์นี้ deploy บน **Vercel** ทั้ง Frontend (static) และ Backend (serverless function) Vercel จะ auto-deploy ทุกครั้งที่มีการ push เข้า branch `main`

### ขั้นตอนตั้งค่า Vercel

1. ไปที่ [vercel.com](https://vercel.com/) ล็อกอินด้วย GitHub แล้วกด **Add New > Project**
2. เลือก repository นี้แล้ว Import — Vercel จะอ่าน `vercel.json` และตั้งค่า framework เป็น Vite ให้อัตโนมัติ
3. ไปที่ **Project Settings > Environment Variables** เพิ่มทั้ง 2 ค่า:
   - `VITE_GOOGLE_SHEET_ID` — Sheet ID ของคุณ
   - `GEMINI_API_KEY` — API key ของคุณ (เป็น **secret** ห้ามใส่ prefix `VITE_`)
4. กด **Deploy** — รอประมาณ 1-2 นาทีก็จะได้ URL `https://【project】.vercel.app`

### Custom Domain

ใน **Project Settings > Domains** เพิ่ม domain ของคุณ Vercel จะออก SSL certificate ให้อัตโนมัติ

### Deploy ที่อื่น (ไม่ใช่ Vercel)

ถ้าจะ deploy frontend บน GitHub Pages / Netlify / Cloudflare Pages แล้วแยก backend ออก:

1. แยก deploy `api/chat.js` ไป serverless platform อื่น (เช่น Cloudflare Workers, Netlify Functions) — ต้องแปลง syntax `req`/`res` ของแต่ละ platform
2. ตั้ง `VITE_CHAT_API_URL` ใน frontend ให้ชี้ไปยัง URL backend ที่ deploy ไว้
3. ถ้ากลับไป GitHub Pages: แก้ `base: '/sut-air-quality/'` ใน `vite.config.js` และเปิด workflow `.github/workflows/deploy.yml` กลับมา (ตอนนี้ปิดอยู่ในชื่อ `(deprecated)`)

## แหล่งที่มาของข้อมูล

ระบบเชื่อมต่อกับ Google Sheets ที่บันทึกข้อมูลจาก ESP32 sensor โดยใช้ **Google Visualization API** ทำการ query แบบ SQL-like:

```sql
SELECT * WHERE E IS NOT NULL ORDER BY A DESC, B DESC LIMIT 1
```

หมายถึง "ดึงแถวที่มีค่า PM2.5 ล่าสุดที่สุด เรียงตามวันที่และเวลาจากใหม่ไปเก่า เอามาเพียง 1 แถว"

### ทำไมใช้วิธีนี้

| วิธี | ขนาด payload | ความเร็ว |
|------|-------------|---------|
| ดาวน์โหลด CSV ทั้งไฟล์ | หลาย MB | ช้า |
| Google Sheets REST API | ปานกลาง | ปานกลาง แต่ต้องใช้ API key |
| **Google Visualization API + query** | **ไม่กี่ Byte** | **เร็วที่สุด ไม่ต้อง API key** |

### โครงสร้าง Sheet ที่คาดหวัง

| คอลัมน์ | ความหมาย |
|--------|---------|
| A | วันที่ (Date) |
| B | เวลา (Time) |
| C, D | (สงวนไว้ — เช่น temp, humidity) |
| E | **ค่า PM 2.5 (µg/m³)** |
| F, G, … | คอลัมน์อื่น ๆ ตามต้องการ |

## เกณฑ์คุณภาพอากาศ

อ้างอิงเกณฑ์ใหม่ของ **กรมควบคุมมลพิษ กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม (มิถุนายน 2566)** ค่าเฉลี่ย 24 ชั่วโมง

| ระดับ | ค่า PM 2.5 (µg/m³) | คุณภาพ | สี | คำแนะนำ |
|------|-------------------|-------|------|---------|
| 1 | 0.0 – 15.0 | ดีมาก | ฟ้า | เหมาะสำหรับกิจกรรมกลางแจ้ง |
| 2 | 15.1 – 25.0 | ดี | เขียว | สามารถทำกิจกรรมกลางแจ้งได้ |
| 3 | 25.1 – 37.5 | ปานกลาง | เหลือง | ผู้ที่มีโรคระบบทางเดินหายใจควรลดกิจกรรมกลางแจ้ง |
| 4 | 37.6 – 75.0 | เริ่มมีผลกระทบต่อสุขภาพ | ส้ม | ผู้ป่วย ผู้สูงอายุ และเด็กเล็กควรงดกิจกรรมกลางแจ้ง |
| 5 | > 75.0 | มีผลกระทบต่อสุขภาพ | แดง | ทุกคนควรหลีกเลี่ยงกิจกรรมกลางแจ้ง ปิดประตูหน้าต่าง |

## การแก้ไขปัญหา

### หน้าเว็บว่างเปล่า (blank page)

เปิด DevTools (`F12`) > Console ดูข้อความสีแดง สาเหตุที่พบบ่อย:

- **`VITE_GOOGLE_SHEET_ID is not set`** — ไม่มีไฟล์ `.env` หรือไม่ได้ตั้งค่า env variable แก้โดยสร้างไฟล์ `.env` แล้ว **restart dev server** (Vite ไม่ reload `.env` อัตโนมัติ)
- **ใส่ URL เต็มแทน Sheet ID** — ตรวจว่า `.env` ใส่เฉพาะ Sheet ID เช่น `170K_lkA...2s_E` ไม่ใช่ `https://docs.google.com/...`

### การ์ดขึ้น "ไม่สามารถรับข้อมูลจากเซนเซอร์ได้"

- ตรวจว่า Google Sheet ตั้งค่าแชร์เป็น **Anyone with the link (Viewer)** แล้ว
- ตรวจว่า `gid` ใน `LOCATIONS` ตรงกับ tab ใน Sheet
- ตรวจว่า Sheet มีข้อมูลในคอลัมน์ E (หรือคอลัมน์ที่ตั้งไว้) อย่างน้อย 1 แถว
- เปิด Network tab ดู request ไปที่ `docs.google.com/.../gviz/tq` ว่า status 200 และ response เป็น JSON ไหม

### Chat AI ตอบ "Internal error contacting Gemini" หรือ "GEMINI_API_KEY is not configured"

- ตรวจว่าตั้ง `GEMINI_API_KEY` ใน Vercel Environment Variables แล้ว (และ redeploy หลังเพิ่ม)
- ตอนรัน local ต้องใช้ `vercel dev` ไม่ใช่ `npm run dev` (Vite อย่างเดียวไม่รู้จัก `/api/chat`)
- ถ้าเจอ HTTP 429 หรือ quota exceeded — Gemini free tier มี rate limit ตรวจที่ [Google AI Studio](https://aistudio.google.com/)

### Chat AI ตอบช้าเกินไป (timeout)

- Vercel Function timeout ตั้งไว้ 15 วินาทีใน `vercel.json` (ฟรี tier ให้ได้สูงสุด 10 วิ — ถ้า deploy ฟรี tier แก้ค่าเป็น `10`)
- ถ้ายังช้า ตรวจว่าเลือก `gemini-2.5-flash-lite` ไว้แล้ว (เป็นรุ่นเร็วที่สุด) แก้ที่ `api/chat.js` ค่า `MODEL`

### Build สำเร็จแต่ deploy แล้ว blank

- ตรวจว่าตั้ง `VITE_GOOGLE_SHEET_ID` ใน Vercel Environment Variables แล้ว และเลือก scope ครบ (Production, Preview, Development)
- หลังเพิ่ม env variable ต้อง **redeploy** เพราะ Vercel ไม่ rebuild อัตโนมัติ
- ตรวจที่ Vercel Dashboard > Deployments > Build Logs ว่า build ผ่านไหม

### Favicon ไม่ขึ้น

ตรวจว่า `index.html` ใช้ relative path `./img/my-icon.png` ไม่ใช่ `/img/my-icon.png` เพราะ absolute path จะไม่ทำงานเมื่อ deploy ไป path ที่ไม่ใช่ root domain

### AI ตอบไม่ตรงค่าจริง / สร้างตัวเลขเอง

ตรวจที่ `App.jsx` ว่าส่ง `sensorContext` ที่มี `libraryPM25` และ `learningPM25` เป็นตัวเลข (ไม่ใช่ `undefined`) ถ้าค่าเซนเซอร์ยังไม่โหลดเสร็จ context จะว่าง AI จะตอบว่า "ยังไม่มีข้อมูล" — ต้องรอให้การ์ดแสดงตัวเลขก่อนค่อยถาม

## License

โปรเจ็กต์นี้สร้างเพื่อการศึกษาภายในมหาวิทยาลัยเทคโนโลยีสุรนารี
