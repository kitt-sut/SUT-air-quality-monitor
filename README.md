# SUT Air Quality Monitoring

เว็บแอปพลิเคชันสำหรับติดตามและรายงานคุณภาพอากาศ (ค่าฝุ่น PM 2.5) ภายในมหาวิทยาลัยเทคโนโลยีสุรนารี (SUT) แบบ Real-time แสดงผลข้อมูลจากเซนเซอร์ ESP32 ที่ติดตั้งตามจุดต่าง ๆ พร้อมแปลงเป็นระดับคุณภาพอากาศ (AQI) ตามมาตรฐานของกรมควบคุมมลพิษประเทศไทย

## สารบัญ

- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [โครงสร้างโปรเจ็กต์](#โครงสร้างโปรเจ็กต์)
- [การติดตั้งและใช้งาน](#การติดตั้งและใช้งาน)
- [การตั้งค่า](#การตั้งค่า)
- [การ Deploy](#การ-deploy)
- [แหล่งที่มาของข้อมูล](#แหล่งที่มาของข้อมูล)
- [เกณฑ์คุณภาพอากาศ](#เกณฑ์คุณภาพอากาศ)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)

## ฟีเจอร์หลัก

- **Real-time Monitoring** — ดึงค่า PM 2.5 ล่าสุดมาแสดงผลและอัปเดตอัตโนมัติทุก 5 นาที โดยใช้ recursive `setTimeout` เพื่อกัน fetch ซ้อนกันในกรณีที่เครือข่ายช้า
- **AQI Standard** — แปลงค่า PM 2.5 เป็นระดับคุณภาพอากาศพร้อมคำแนะนำในการปฏิบัติตัว ตามเกณฑ์ของกรมควบคุมมลพิษ (มิ.ย. 2566)
- **Stale Data Fallback** — เมื่อเซนเซอร์ออฟไลน์หรือดึงข้อมูลไม่สำเร็จ ระบบจะยังคงแสดงค่าล่าสุดที่ดึงได้สำเร็จ พร้อม badge บอกว่าเป็นข้อมูลเก่ากี่นาที/ชั่วโมงที่แล้ว
- **Google Sheets Integration** — ดึงข้อมูลจาก Google Sheets ที่บันทึกจาก ESP32 ผ่าน Google Visualization API โดยใช้ query แบบ SQL เพื่อโหลดเฉพาะข้อมูลล่าสุด ลดขนาด payload จากหลาย MB เหลือไม่กี่ Byte
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
| Deployment | [GitHub Pages](https://pages.github.com/) (ผ่าน GitHub Actions) |
| Font | Sarabun (Google Fonts) |

## โครงสร้างโปรเจ็กต์

```
sut-air-quality/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deploy to Pages
├── public/
│   └── img/                    # รูปอาคารสำหรับแต่ละจุดเซนเซอร์
├── src/
│   ├── components/
│   │   ├── AQILegend.jsx       # แถบอธิบายเกณฑ์ AQI
│   │   ├── Icons.jsx           # SVG icons (inline)
│   │   └── LocationCard.jsx    # การ์ดแสดงค่าของแต่ละจุด
│   ├── config/
│   │   └── index.js            # ค่าคงที่ เช่น LOCATIONS, FETCH_INTERVAL_MS
│   ├── hooks/
│   │   ├── useCountUp.js       # Animate ตัวเลขจากค่าเก่าไปค่าใหม่
│   │   └── useSensorData.js    # จัดการการ fetch, polling, abort, state
│   ├── services/
│   │   └── sheetService.js     # ดึงและ parse ข้อมูลจาก Google Sheets
│   ├── utils/
│   │   └── aqi.js              # แปลง PM2.5 เป็นข้อมูล AQI (สี, label, คำแนะนำ)
│   ├── App.jsx                 # Root component
│   ├── index.css               # Tailwind + custom keyframes
│   └── main.jsx                # Entry point
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## การติดตั้งและใช้งาน

### Prerequisites

- Node.js 20 ขึ้นไป
- npm 10 ขึ้นไป
- Google Sheet ที่บันทึกข้อมูลจากเซนเซอร์ (ดูรายละเอียดในส่วน [แหล่งที่มาของข้อมูล](#แหล่งที่มาของข้อมูล))

### 1. Clone repository

```bash
git clone https://github.com/kitt-sut/sut-air-quality
cd sut-air-quality
```

### 2. ติดตั้ง dependencies

```bash
npm install
```

### 3. ตั้งค่า environment variables

สร้างไฟล์ `.env` ที่ root ของโปรเจ็กต์ (โฟลเดอร์เดียวกับ `package.json`)

```env
VITE_GOOGLE_SHEET_ID=ใส่_Sheet_ID_ของคุณตรงนี้
```

**วิธีหา Sheet ID:** เปิด Google Sheet แล้วดู URL

```
https://docs.google.com/spreadsheets/d/【Sheet ID อยู่ตรงนี้】/edit
```

> หมายเหตุ: ใส่เฉพาะ Sheet ID เท่านั้น ไม่ใส่ URL เต็ม
>
> และ Google Sheet ต้องตั้งค่าการแชร์เป็น **"Anyone with the link"** (Viewer) ไม่อย่างนั้นการ fetch จะถูกตอบกลับเป็นหน้า login ของ Google แทน JSON

### 4. รัน development server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:5173/sut-air-quality/`

### 5. Build สำหรับ production

```bash
npm run build
npm run preview     # ทดสอบ production build บนเครื่อง
```

## การตั้งค่า

### เพิ่ม/แก้ไขจุดเซนเซอร์

แก้ที่ `src/config/index.js`

```js
export const LOCATIONS = [
  {
    id: 1,
    sensorId: 'ESP32_01',                    // ใช้แสดงเป็น badge บนรูป
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

## การ Deploy

โปรเจ็กต์นี้ตั้งค่าให้ deploy ไป GitHub Pages อัตโนมัติเมื่อ push เข้า branch `main` ผ่าน workflow ใน `.github/workflows/deploy.yml`

### ขั้นตอนตั้งค่า GitHub Pages

1. ไปที่ Repository **Settings** > **Pages** เลือก Source = **GitHub Actions**
2. ไปที่ **Settings** > **Secrets and variables** > **Actions** > **Variables** กด **New repository variable**
   - Name: `VITE_GOOGLE_SHEET_ID`
   - Value: Sheet ID ของคุณ
3. Push code เข้า branch `main` GitHub Actions จะ build และ deploy อัตโนมัติ

### ถ้า deploy ไป path อื่น

แก้ `base` ใน `vite.config.js` ให้ตรงกับชื่อ repository

```js
export default defineConfig({
  plugins: [react()],
  base: '/ชื่อ-repo-ของคุณ/',
});
```

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

### Build สำเร็จแต่ deploy ขึ้น Pages แล้ว blank

- ตรวจว่า `base` ใน `vite.config.js` ตรงกับชื่อ repository
- ตรวจว่าตั้งค่า `VITE_GOOGLE_SHEET_ID` ใน Repository Variables ของ GitHub แล้ว
- เช็คใน Actions tab ว่า workflow build ผ่านไหม

### Favicon ไม่ขึ้น

ตรวจว่า `index.html` ใช้ relative path `./img/my-icon.png` ไม่ใช่ `/img/my-icon.png` เพราะ absolute path จะไม่ทำงานเมื่อ deploy ไป path ที่ไม่ใช่ root domain

## License

โปรเจ็กต์นี้สร้างเพื่อการศึกษาภายในมหาวิทยาลัยเทคโนโลยีสุรนารี
