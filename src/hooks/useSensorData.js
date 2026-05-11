import { useState, useEffect, useCallback, useRef } from 'react';
import { LOCATIONS, FETCH_INTERVAL_MS } from '../config';
import { fetchPM25 } from '../services/sheetService';

const useSensorData = () => {
  const [sensorData, setSensorData]             = useState({});
  const [errorSensors, setErrorSensors]         = useState({});
  const [sensorTimestamps, setSensorTimestamps] = useState({}); // เก็บ Date ของการ fetch สำเร็จล่าสุดของแต่ละเซนเซอร์
  const [lastUpdate, setLastUpdate]             = useState('');
  const [loading, setLoading]                   = useState(true);
  const [fetchError, setFetchError]             = useState(false);

  const abortControllerRef = useRef(null);
  const timeoutRef         = useRef(null); // ใช้ setTimeout แทน setInterval

  const refresh = useCallback(async () => {
    // 1. ถ้าระบบกำลังดึงข้อมูลอยู่ แล้วมีคำสั่งใหม่เข้ามา (เช่น รีเฟรชรัวๆ) ให้ยกเลิกอันเก่าทันที
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // สร้าง Controller ประจำรอบนี้โดยเฉพาะ
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setFetchError(false);

    const newReadings   = {};
    const newErrors     = {};
    const newTimestamps = {};
    let anySuccess      = false;

    const fetchPromises = LOCATIONS.map(async (loc) => {
      if (!loc.gid) return null;
      try {
        const pm25 = await fetchPM25(loc.gid, loc.sensorId, controller.signal);
        return { sensorId: loc.sensorId, pm25, error: false };
      } catch (err) {
        if (err.name === 'AbortError') return null; // ข้ามการแจ้ง Error ถ้าจงใจยกเลิก
        console.error(`[${loc.sensorId}]`, err.message);
        return { sensorId: loc.sensorId, pm25: null, error: true };
      }
    });

    const results = await Promise.all(fetchPromises);

    // 2. *** แก้ปัญหา ***
    // ถ้ารอบนี้ถูกยกเลิกไปแล้ว (เพราะเปลี่ยนหน้า หรือมีคำสั่งใหม่มาแทน) ให้หยุดเลย ไม่ต้องไปยุ่งกับ State
    if (controller.signal.aborted) return;

    const successAt = new Date();
    results.forEach((result) => {
      if (result) {
        if (result.error) {
          newErrors[result.sensorId] = true;
        } else {
          newReadings[result.sensorId]   = result.pm25;
          newTimestamps[result.sensorId] = successAt;
          anySuccess = true;
        }
      }
    });

    // อัปเดตข้อมูลเซนเซอร์ — merge ของใหม่ทับของเก่า ค่าเก่ายังอยู่ถ้ารอบนี้ fetch ไม่สำเร็จ
    setSensorData((prev) => ({ ...prev, ...newReadings }));
    setSensorTimestamps((prev) => ({ ...prev, ...newTimestamps }));
    setErrorSensors(newErrors);

    // ถ้าไม่มีข้อมูลไหนสำเร็จเลย ให้แสดง Error
    setFetchError(!anySuccess);

    // อัปเดตเวลาเสมอ เพื่อให้รู้ว่าระบบยังพยายามดึงข้อมูลอยู่
    setLastUpdate(new Date().toLocaleString('th-TH'));
    setLoading(false);
  }, []);

  useEffect(() => {
    // ใช้ flag กัน schedule ถูกเรียกหลัง unmount (เช่น refresh() รอบแรก
    // resolve หลังคอมโพเนนต์ถูก unmount ไปแล้ว เพราะ AbortController)
    let cancelled = false;

    // นัดหมาย fetch รอบถัดไปหลังจาก fetch รอบปัจจุบันเสร็จสมบูรณ์แล้วเท่านั้น
    // ป้องกัน fetch ซ้อนกันในกรณีที่ network ช้ากว่า FETCH_INTERVAL_MS
    const schedule = () => {
      if (cancelled) return;
      timeoutRef.current = setTimeout(async () => {
        await refresh();
        schedule(); // นัดหมายรอบต่อไปหลัง fetch เสร็จ ไม่ใช่ตามเวลานาฬิกา
      }, FETCH_INTERVAL_MS);
    };

    // fetch ครั้งแรกทันที แล้วค่อยเริ่ม schedule
    refresh().then(() => {
      if (!cancelled) schedule();
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refresh]);

  return { sensorData, errorSensors, sensorTimestamps, lastUpdate, loading, fetchError, refresh };
};

export default useSensorData;