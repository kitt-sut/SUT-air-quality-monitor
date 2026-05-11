/**
 * Thailand AQI — PM2.5 levels
 * Reference: กรมควบคุมมลพิษ (Pollution Control Department) - อัปเดตเกณฑ์ใหม่ 1 มิ.ย. 2566
 * Unit: µg/m³ (24-hour average)
 *
 * Level  | PM2.5 range | Colour
 * -----  | ----------- | ------
 * 1      |  0.0 – 15.0 | Teal   (#1EC8C8)
 * 2      | 15.1 – 25.0 | Green  (#92D14F)
 * 3      | 25.1 – 37.5 | Yellow (#FFCF00)
 * 4      | 37.6 – 75.0 | Orange (#FF7E00)
 * 5      |    > 75.0   | Red    (#FF0000)
 */
export const getAQIInfo = (pm25) => {
  // เพิ่มการเช็ค typeof และเช็คว่าค่าน้อยกว่า 0 ไหม เพื่อความปลอดภัยสูงสุด
  if (typeof pm25 !== 'number' || isNaN(pm25) || pm25 < 0) return null;

  if (pm25 <= 15.0)
    return {
      level: 1,
      label: 'ดีมาก',
      enLabel: 'Very Good',
      face: '😊',
      desc: 'คุณภาพอากาศดีมาก เหมาะสำหรับกิจกรรมกลางแจ้ง',
      color: '#00B0F0',
      textColor: '#006B93',
      gradFrom: '#33C5F3',
      gradTo: '#0097CE',
    };

  if (pm25 <= 25.0)
    return {
      level: 2,
      label: 'ดี',
      enLabel: 'Good',
      face: '🙂',
      desc: 'คุณภาพอากาศดี สามารถทำกิจกรรมกลางแจ้งได้',
      color: '#92D14F',
      textColor: '#4a7a1e',
      gradFrom: '#A8E063',
      gradTo: '#78C42F',
    };

  if (pm25 <= 37.5)
    return {
      level: 3,
      label: 'ปานกลาง',
      enLabel: 'Moderate',
      face: '😐',
      desc: 'ผู้ที่มีโรคระบบทางเดินหายใจควรลดกิจกรรมกลางแจ้ง',
      color: '#FFCF00',
      textColor: '#8a6e00',
      gradFrom: '#FFE033',
      gradTo: '#F5C400',
    };

  if (pm25 <= 75.0)
    return {
      level: 4,
      label: 'เริ่มมีผลกระทบต่อสุขภาพ',
      enLabel: 'Unhealthy for Sensitive Groups',
      face: '😷',
      desc: 'ผู้ป่วย ผู้สูงอายุ และเด็กเล็กควรงดกิจกรรมกลางแจ้ง',
      color: '#FF7E00',
      textColor: '#a34e00',
      gradFrom: '#FF9520',
      gradTo: '#E86E00',
    };

  return {
    level: 5,
    label: 'มีผลกระทบต่อสุขภาพ',
    enLabel: 'Unhealthy',
    face: '🤢',
    desc: 'ทุกคนควรหลีกเลี่ยงกิจกรรมกลางแจ้ง ปิดประตูหน้าต่าง',
    color: '#FF0000',
    textColor: '#9b0000',
    gradFrom: '#FF3333',
    gradTo: '#CC0000',
  };
};