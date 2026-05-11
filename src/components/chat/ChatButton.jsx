import { useCallback, useState } from 'react';
import ChatWindow from './ChatWindow';
import { IconChat } from '../Icons';

/**
 * ปุ่มลอยเปิด/ปิดหน้าต่างแชท
 * - ใช้ aria-expanded เพื่อ a11y
 * - ป้องกัน re-render ที่ไม่จำเป็นด้วย useCallback
 *
 * @param {Object} props
 * @param {Object} props.sensorContext - { libraryPM25, learningPM25 } ส่งต่อให้ ChatWindow
 */
export default function ChatButton({ sensorContext }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = useCallback(() => setIsOpen((open) => !open), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'ปิดแชท AI' : 'เปิดแชท AI'}
        title={isOpen ? 'ปิดแชท AI' : 'เปิดแชท AI'}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full
                   bg-gradient-to-br from-blue-500 to-blue-600
                   text-white shadow-lg hover:shadow-xl
                   transition-all duration-300 transform hover:scale-110
                   flex items-center justify-center group
                   focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        <IconChat className="w-7 h-7 group-hover:scale-110 transition-transform" />
      </button>

      {isOpen && <ChatWindow onClose={close} sensorContext={sensorContext} />}
    </>
  );
}
