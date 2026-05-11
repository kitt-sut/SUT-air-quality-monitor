import { useState } from 'react';
import { getAQIInfo } from '../utils/aqi';
import useCountUp from '../hooks/useCountUp';
import { IconMapPin, IconAlertCircle } from './Icons';

/**
 * สถานะของการ์ดมี 4 แบบ (state machine) เพื่อป้องกัน logic ซ้อนทับกัน:
 *  'loading' — กำลังโหลดครั้งแรก (ยังไม่มีข้อมูลเลย)
 *  'error'   — ไม่มีข้อมูลที่ใช้งานได้และ fetch ล่าสุดล้มเหลว
 *  'stale'   — fetch ล่าสุดล้มเหลว แต่มีค่าเก่าค้างอยู่ → แสดงค่าเก่า + บอกว่าเก่า
 *  'data'    — มีข้อมูล PM2.5 ที่ถูกต้องและเป็นค่าล่าสุด
 */
const resolveCardState = (loading, pm25, hasError) => {
  const hasNumericData = typeof pm25 === 'number' && !isNaN(pm25) && pm25 >= 0;
  if (hasNumericData && !hasError) return 'data';
  if (hasNumericData && hasError)  return 'stale';
  if (loading)                     return 'loading';
  return 'error';
};

/**
 * คำนวณข้อความ "X นาที/ชั่วโมงที่แล้ว" สำหรับโชว์ความเก่าของข้อมูล
 */
const formatRelativeTime = (date) => {
  if (!date) return '';
  const diffMs   = Date.now() - date.getTime();
  const diffMin  = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'เมื่อสักครู่';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr} ชั่วโมงที่แล้ว`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} วันที่แล้ว`;
};

const LocationCard = ({ data, pm25, loading, hasError, lastFetchAt }) => {
  const cardState = resolveCardState(loading, pm25, hasError);
  const aqiInfo   = getAQIInfo(pm25); // จะเป็น null ถ้า pm25 ไม่ valid

  // useCountUp รับค่า pm25 ที่ผ่านการตรวจสอบแล้วเสมอ — รวมทั้ง state 'data' และ 'stale'
  const showsData   = cardState === 'data' || cardState === 'stale';
  const safePm25    = showsData ? pm25 : 0;
  const displayPm25 = useCountUp(safePm25);

  const [imgSrc, setImgSrc]         = useState(data.image);
  const [imgFailed, setImgFailed]   = useState(false);

  return (
      <div
          className="relative overflow-hidden rounded-[2rem] shadow-xl bg-white group
                 hover:shadow-2xl transition-all duration-500 border border-gray-100
                 h-full flex flex-col"
      >
        {/* ── Top Border ── */}
        <div
            className="absolute top-0 left-0 right-0 h-1 z-30"
            style={{ backgroundColor: aqiInfo ? aqiInfo.color : '#d1d5db' }}
        />

        {/* ── Image ── */}
        <div className="relative h-48 md:h-56 overflow-hidden">
          <img
              src={imgSrc}
              onError={(e) => {
                if (!imgFailed && imgSrc !== data.fallback) {
                  // รอบแรก: ลอง fallback URL
                  setImgFailed(true);
                  setImgSrc(data.fallback);
                } else {
                  // รอบสอง: fallback ก็ fail → ซ่อน img ไม่ให้ loop ต่อ
                  e.currentTarget.style.display = 'none';
                }
              }}
              alt={data.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-black/30 z-10" />

          {/* Location label */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm
                          px-4 py-2 rounded-xl shadow-sm max-w-full">
              <IconMapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-bold text-gray-800 truncate">{data.name}</span>
            </div>
          </div>

          {/* Sensor ID badge */}
          <div className="absolute top-4 right-4 z-20">
          <span className="text-[10px] font-mono bg-black/50 text-white px-2 py-1
                           rounded backdrop-blur-md">
            ID: {data.sensorId}
          </span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="relative flex-1 p-6 flex flex-col items-center justify-center bg-white rounded-t-[2rem] -mt-6">

          {/* ── State: loading ── */}
          {cardState === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-44 h-44 rounded-full border-8 border-gray-100 animate-pulse bg-gray-50" />
                <div className="w-24 h-4 bg-gray-100 rounded-full animate-pulse" />
              </div>
          )}

          {/* ── State: error ── */}
          {cardState === 'error' && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-44 h-44 rounded-full border-8 border-gray-200
                            flex flex-col items-center justify-center bg-gray-50">
                  <IconAlertCircle className="w-10 h-10 text-gray-300" />
                  <span className="text-gray-400 text-xs mt-1">ไม่มีข้อมูล</span>
                </div>
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <IconAlertCircle className="w-3 h-3" />
                  ไม่สามารถรับข้อมูลจากเซนเซอร์ได้
                </p>
              </div>
          )}

          {/* ── State: data / stale (UI เดียวกัน แค่เพิ่ม badge บอกความเก่าและลด opacity เล็กน้อยตอน stale) ── */}
          {showsData && aqiInfo && (
              <div className={`flex flex-col items-center w-full ${cardState === 'stale' ? 'opacity-75' : ''}`}>
                {cardState === 'stale' && (
                    <div className="mb-3 flex items-center justify-center gap-1.5 text-xs
                                  bg-amber-50 border border-amber-200 text-amber-700
                                  rounded-full px-3 py-1">
                      <IconAlertCircle className="w-3 h-3" />
                      <span>ข้อมูลล่าสุด · {formatRelativeTime(lastFetchAt)}</span>
                    </div>
                )}

                <div className="relative mb-5 mt-2">
                  {/* Glow */}
                  <div
                      className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-1000"
                      style={{ backgroundColor: aqiInfo.color }}
                  />
                  {/* Ring */}
                  <div
                      className="relative flex flex-col items-center justify-center
                           w-44 h-44 rounded-full border-[8px] bg-white shadow-inner
                           transition-colors duration-700"
                      style={{ borderColor: aqiInfo.color }}
                  >
                <span
                    className="text-6xl font-black tracking-tighter leading-none transition-colors duration-500"
                    style={{ color: aqiInfo.textColor }}
                >
                  {displayPm25}
                </span>
                    <span className="text-gray-400 text-xs font-medium mt-0.5">µg/m³</span>
                    <span className="text-3xl mt-1.5 transition-transform group-hover:scale-110 drop-shadow-sm">
                  {aqiInfo.face}
                </span>
                  </div>
                </div>

                <div className="text-center space-y-1.5 w-full">
                  <div
                      className="inline-block px-4 py-1.5 rounded-full text-white text-sm font-bold shadow-md"
                      style={{ background: `linear-gradient(to right, ${aqiInfo.gradFrom}, ${aqiInfo.gradTo})` }}
                  >
                    {aqiInfo.label}
                  </div>
                  <p className="text-xs text-gray-400">{aqiInfo.enLabel}</p>
                  <p className="text-gray-500 text-xs px-4 min-h-[2rem] flex items-center
                            justify-center text-center leading-snug">
                    {aqiInfo.desc}
                  </p>
                </div>
              </div>
          )}
        </div>
      </div>
  );
};

export default LocationCard;