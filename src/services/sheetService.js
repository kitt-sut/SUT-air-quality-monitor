import { SHEET_ID, PM25_COL_INDEX } from '../config';

// ── Validate ก่อนสร้าง URL ──────────────────────────────────────────────────
// ทำที่ module level เพื่อให้ fail เร็วที่สุด (ตอน app เริ่มต้น)
// ไม่ใช่ตอน user รอผลข้อมูลอยู่
if (!SHEET_ID) {
  throw new Error(
      '[sheetService] VITE_GOOGLE_SHEET_ID is not set.\n' +
      'Please create a .env file and add: VITE_GOOGLE_SHEET_ID=<your_sheet_id>'
  );
}

// สร้าง base URL ครั้งเดียวตอน module โหลด ไม่สร้างซ้ำทุก call
const SHEET_BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;

/**
 * Fetch the latest PM2.5 reading from a specific Google Sheet tab (by gid)
 * using the Google Visualization API for optimized performance.
 *
 * @param {string} gid      - Sheet tab GID
 * @param {string} sensorId - Used for error logging only
 * @param {AbortSignal} signal - Used to cancel data retrieval
 * @returns {Promise<number>} PM2.5 value
 * @throws {Error} if no valid data is found or the request fails
 */
export const fetchPM25 = async (gid, sensorId, signal) => {
  const query = encodeURIComponent(
      'SELECT * WHERE E IS NOT NULL ORDER BY A DESC, B DESC LIMIT 1'
  );
  const url = `${SHEET_BASE_URL}?tqx=out:json&gid=${gid}&tq=${query}`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${sensorId}`);

  const text = await response.text();

  const match = text.match(/google\.visualization\.Query\.setResponse\((\{[\s\S]*})\s*\)/);
  if (!match) {
    throw new Error(`Unexpected response format for ${sensorId}`);
  }

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (err) {
    throw new Error(`Invalid JSON format for ${sensorId}: ${err.message}`);
  }

  // ดักจับ Error ของ API ตรงนี้ครับ
  if (data.status === 'error') {
    throw new Error(`Google API Error: ${data.errors[0].message}`);
  }

  // ป้องกัน TypeError ในกรณีที่ Sheet ส่ง rows ว่างกลับมา (query ไม่เจอแถวที่ตรงเงื่อนไข)
  const row = data?.table?.rows?.[0];
  if (!row) {
    throw new Error(`No rows returned for ${sensorId}`);
  }

  const cell = row.c?.[PM25_COL_INDEX];
  if (cell !== null && cell !== undefined) {
    const pm25Value = cell.v;
    if (typeof pm25Value === 'number' && !isNaN(pm25Value) && pm25Value >= 0) {
      return pm25Value;
    }
  }

  throw new Error(`No valid PM2.5 data found for ${sensorId}`);
};