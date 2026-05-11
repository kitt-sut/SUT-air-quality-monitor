import { IconInfo } from './Icons';

const LEVELS = [
  { range: '0 – 15',  label: 'ดีมาก',                      color: '#00B0F0' },
  { range: '15.1 – 25', label: 'ดี',                          color: '#92D14F' },
  { range: '25.1 – 37.5', label: 'ปานกลาง',                    color: '#FFCF00' },
  { range: '37.6 – 75', label: 'เริ่มมีผลกระทบต่อสุขภาพ',    color: '#FF7E00' },
  { range: '> 75',    label: 'มีผลกระทบต่อสุขภาพ',         color: '#FF0000' },
];

const AQILegend = () => (
  <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm">
      <IconInfo className="w-4 h-4 text-blue-500" />
      เกณฑ์คุณภาพอากาศ PM 2.5 — มาตรฐานประเทศไทย (กรมควบคุมมลพิษ)
    </h3>

    <div className="flex flex-wrap gap-2">
      {LEVELS.map(({ range, label, color }) => (
        <div
          key={range}
          className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 text-sm border border-gray-100"
        >
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="font-mono text-xs text-gray-400">{range}</span>
          <span className="font-medium text-gray-700">{label}</span>
        </div>
      ))}
    </div>

    <p className="mt-3 text-xs text-gray-400">
      หน่วย: µg/m³ &nbsp;·&nbsp; ค่าเฉลี่ย 24 ชั่วโมง &nbsp;·&nbsp;
      อ้างอิง: กรมควบคุมมลพิษ กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม
    </p>
  </div>
);

export default AQILegend;
