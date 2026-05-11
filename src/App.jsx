import { useState, useEffect, useMemo } from 'react';
import { LOCATIONS, FETCH_INTERVAL_MS } from './config';
import useSensorData from './hooks/useSensorData';
import LocationCard from './components/LocationCard';
import AQILegend from './components/AQILegend';
import { ChatButton } from './components/chat';
import { IconCloudFog, IconRefresh, IconExternalLink, IconInfo, IconAlertCircle } from './components/Icons';

const FETCH_INTERVAL_MIN = Math.round(FETCH_INTERVAL_MS / 60_000);

function App() {
  const [loaded, setLoaded] = useState(false);
  const { sensorData, errorSensors, sensorTimestamps, lastUpdate, loading, fetchError, refresh } = useSensorData();

  // Trigger entrance animations after first mount
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // บริบทสำหรับ Chat AI — useMemo เพื่อไม่ให้สร้าง object ใหม่ทุก render
  const sensorContext = useMemo(
    () => ({
      libraryPM25: sensorData?.ESP32_01,
      learningPM25: sensorData?.ESP32_02,
    }),
    [sensorData?.ESP32_01, sensorData?.ESP32_02]
  );

  return (
    <div className="min-h-screen pb-16">

      {/* ── Navbar ── */}
      <nav
        className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm
                   transition-all duration-700"
        style={{
          transform: loaded ? 'translateY(0)' : 'translateY(-100%)',
          opacity:   loaded ? 1 : 0,
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
            <IconCloudFog className="w-6 h-6 animate-float" />
            <span>SUT Air Quality</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:flex items-center gap-2 text-xs text-gray-400
                             bg-gray-100 px-3 py-1.5 rounded-full">
              <IconRefresh className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              อัปเดต: {lastUpdate || '—'}
            </span>
            <a
              href="https://sut-air-pollution.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-500 hover:text-blue-600
                         flex items-center gap-1 transition-colors"
            >
              Dashboard <IconExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">

        {/* ── Header ── */}
        <div
          className="text-center mb-8 transition-opacity duration-700"
          style={{ opacity: loaded ? 1 : 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">
            รายงานคุณภาพอากาศ
          </h1>
          <p className="text-gray-500">
            ติดตามค่าฝุ่น PM 2.5 ภายในมหาวิทยาลัยเทคโนโลยีสุรนารีแบบ Real-time
          </p>
        </div>

        {/* ── Global error banner: แสดงเฉพาะตอนยังไม่มีข้อมูลของเซนเซอร์ใดเลย ── */}
        {fetchError && !loading && Object.keys(sensorData).length === 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-3
                          flex items-center gap-3 text-sm text-red-600">
            <IconAlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">
              ไม่สามารถเชื่อมต่อกับเซนเซอร์ได้ในขณะนี้ ระบบจะลองใหม่อีกครั้งใน {FETCH_INTERVAL_MIN} นาที
            </span>
            <button
              onClick={refresh}
              className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1
                         rounded-lg transition-colors font-medium"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
          {LOCATIONS.map((loc, index) => (
            <div
              key={loc.id}
              className="opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <LocationCard
                data={loc}
                pm25={sensorData[loc.sensorId]}
                loading={loading}
                hasError={!!errorSensors[loc.sensorId]}
                lastFetchAt={sensorTimestamps[loc.sensorId]}
              />
            </div>
          ))}
        </div>

        {/* ── AQI Legend ── */}
        <div
          className="transition-opacity duration-700 delay-300"
          style={{ opacity: loaded ? 1 : 0 }}
        >
          <AQILegend />
        </div>

        {/* ── Dashboard CTA ── */}
        <div
          className="mt-6 transition-opacity duration-700 delay-500"
          style={{ opacity: loaded ? 1 : 0 }}
        >
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6
                          flex flex-col md:flex-row items-center gap-4
                          shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-white p-3 rounded-full shadow-sm text-blue-500">
              <IconInfo className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-gray-700">ต้องการดูข้อมูลสถิติย้อนหลัง?</h3>
              <p className="text-sm text-gray-500">
                สามารถดูข้อมูลกราฟแนวโน้มรายชั่วโมงและรายวันได้ที่ระบบ Dashboard หลัก
              </p>
            </div>
            <a
              href="https://sut-air-pollution.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                         text-white font-medium rounded-lg shadow transition-colors
                         text-sm flex justify-center items-center gap-2"
            >
              ดูข้อมูลทั้งหมด <IconExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            © 2026 SUT Air Pollution Monitoring System
            &nbsp;·&nbsp; มาตรฐาน AQI ประเทศไทย โดย กรมควบคุมมลพิษ
          </p>
        </div>

      </main>

      {/* ── Floating Chat Button ── */}
      <ChatButton sensorContext={sensorContext} />
    </div>
  );
}

export default App;
