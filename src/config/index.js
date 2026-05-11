export const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

// ค่าคงที่สำหรับเก็บตำแหน่งของคอลัมน์ PM2.5 (คอลัมน์ E = ลำดับที่ 4)
export const PM25_COL_INDEX = 4;

export const LOCATIONS = [
  {
    id: 1,
    sensorId: 'ESP32_01',
    gid: '1098888062',
    image: `${import.meta.env.BASE_URL}img/Library.jpg`,
    name: 'อาคารบรรณสาร (Library)',
    fallback:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 2,
    sensorId: 'ESP32_02',
    gid: '1804783139',
    image: `${import.meta.env.BASE_URL}img/LearningBuilding_1.jpg`,
    name: 'อาคารเรียนรวม 1 (Learning Building 1)',
    fallback:
      'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000&auto=format&fit=crop',
  },
];

export const FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
