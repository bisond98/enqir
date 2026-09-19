import { X } from "lucide-react";

interface CallNumberPopupProps {
  number: string;
  onClose: () => void;
}

/**
 * Shared "Connect" number popup — tap the blue number pill to make the real call.
 * Decorative buy/sell/connect-safe doodles fill the popup background; the
 * CONNECT header, number pill and red close button overlap them.
 */
const CallNumberPopup = ({ number, onClose }: CallNumberPopupProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl border-2 border-black shadow-[0_8px_0_0_rgba(0,0,0,0.3)] p-6 w-full max-w-sm text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative small buy/sell/connect-safe icon doodles scattered across the whole popup — buttons overlap them */}
        <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          {/* faint background dots */}
          <circle cx="26" cy="52" r="1" fill="#9CA3AF" opacity="0.6" />
          <circle cx="178" cy="24" r="1" fill="#9CA3AF" opacity="0.6" />
          <circle cx="118" cy="66" r="1" fill="#9CA3AF" opacity="0.6" />
          <circle cx="12" cy="120" r="1" fill="#9CA3AF" opacity="0.5" />
          <circle cx="188" cy="116" r="1" fill="#9CA3AF" opacity="0.5" />
          <circle cx="62" cy="8" r="1" fill="#9CA3AF" opacity="0.6" />
          <circle cx="142" cy="52" r="1" fill="#9CA3AF" opacity="0.6" />
          <circle cx="84" cy="146" r="1" fill="#9CA3AF" opacity="0.5" />

          {/* CALL: tiny phone handset (top-right) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 168 20 Q 167.4 17.1 169.3 16.4 L 170.9 18 Q 171.5 19.3 169.9 19.9 Q 171.2 22.3 173.6 23.1 Q 174.9 21.5 176.5 22.2 L 178.1 23.8 Q 177.4 25.7 174.4 24.7 Q 169.4 23.1 168 20 Z" />
            <path d="M 173 14 Q 175.5 12.8 177.5 14" opacity="0.9" />
          </g>

          {/* STAR: rating (top-left-mid) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 66 14 L 67.2 16.6 L 70 17 L 68 19 L 68.5 21.8 L 66 20.5 L 63.5 21.8 L 64 19 L 62 17 L 64.8 16.6 Z" />
          </g>

          {/* CHAT: speech bubble (top-left) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 22 24 Q 22 20.5 26 20.5 L 33 20.5 Q 37 20.5 37 24 Q 37 27.5 33 27.5 L 28 27.5 L 24.5 30.5 L 25 27.5 Q 22 27.5 22 24 Z" />
            <circle cx="26.5" cy="24" r="0.5" fill="#6B7280" stroke="none" />
            <circle cx="29.5" cy="24" r="0.5" fill="#6B7280" stroke="none" />
            <circle cx="32.5" cy="24" r="0.5" fill="#6B7280" stroke="none" />
          </g>

          {/* RUPEE: ₹ coin (top-mid-left) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <circle cx="96" cy="16" r="4.5" />
            <path d="M 94.2 13.5 L 97.8 13.5 M 94.2 15.8 L 97.8 15.8 M 94.5 13.5 Q 98 15 94.8 18.5 L 98.5 13.5" strokeWidth="0.55" />
          </g>

          {/* SAFE: shield with check (top-mid-right) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 130 22 L 134.4 23.6 L 134.4 28.2 Q 134.4 31.7 130 33.4 Q 125.6 31.7 125.6 28.2 L 125.6 23.6 Z" />
            <path d="M 127.7 28.2 L 129.3 29.8 L 132.4 26.2" />
          </g>

          {/* SELL: price tag (top-right-mid) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 148 42 L 152 38 L 156.5 38 L 156.5 42.5 L 152.5 46.5 Z" />
            <circle cx="154.4" cy="40.2" r="0.5" />
          </g>

          {/* BUY: shopping bag (mid-left) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 44 68 L 44.7 74 L 50.3 74 L 51 68 Z" />
            <path d="M 46 68 Q 46 65.8 47.5 65.8 Q 49 65.8 49 68" />
          </g>

          {/* DEAL: exchange arrows (mid-right) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <line x1="158" y1="70.5" x2="163.5" y2="70.5" />
            <path d="M 161.6 68.8 L 163.8 70.5 L 161.6 72.2" />
            <line x1="163.5" y1="75" x2="158" y2="75" />
            <path d="M 159.9 73.3 L 157.7 75 L 159.9 76.7" />
          </g>

          {/* TRUST: thumbs up (mid-left-2) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 78 64 L 78 72 L 75.5 72 L 75.5 64 Z M 78 65 L 80 65 Q 81.5 65 81.3 66.5 L 80.8 69.5 Q 80.6 71 79 71 L 78 71" />
          </g>

          {/* CONNECT: link (mid-right-2) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 138 62 Q 137.2 60.6 138.7 60 L 140.5 59.4" />
            <path d="M 143.2 57.6 Q 144.7 57 145.3 58.5 Q 145.9 60 144.4 60.6 L 142.6 61.2" />
            <line x1="141.7" y1="59.8" x2="142.9" y2="59.4" />
          </g>

          {/* HEART: liked (center) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 108 88 Q 106 85.5 103.8 87 Q 101.8 88.5 103.5 91 L 108 95 L 112.5 91 Q 114.2 88.5 112.2 87 Q 110 85.5 108 88 Z" />
          </g>

          {/* CHECK: small check circle (mid-left-3) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <circle cx="14" cy="86" r="3.2" />
            <path d="M 12.6 86 L 13.6 87 L 15.5 84.8" />
          </g>

          {/* KEY: secure access (mid-right-3) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <circle cx="186" cy="92" r="2.5" />
            <path d="M 187.8 93.8 L 192 98 M 190.5 96.5 L 192 95 M 188.8 94.8 L 190.3 93.3" />
          </g>

          {/* TRUCK: fast delivery (bottom-left) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <rect x="22" y="128" width="8" height="5.5" rx="0.8" />
            <path d="M 30 129.5 L 34 129.5 L 36 131.5 L 36 133.5 L 30 133.5" />
            <circle cx="26.5" cy="135" r="1.2" />
            <circle cx="33.5" cy="135" r="1.2" />
          </g>

          {/* BOX: delivery (bottom-mid-left) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <rect x="64" y="140" width="8" height="6.5" rx="1" />
            <line x1="64" y1="143" x2="72" y2="143" />
            <line x1="68" y1="140" x2="68" y2="143" />
          </g>

          {/* TAG: small tag (bottom-mid) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 98 142 L 101 139 L 104.5 139 L 104.5 142.5 L 101.5 145.5 Z" />
            <circle cx="102.9" cy="140.7" r="0.5" />
          </g>

          {/* PHONE: handset (bottom-mid-right) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 124 136 Q 123.4 133.1 125.3 132.4 L 126.9 134 Q 127.5 135.3 125.9 135.9 Q 127.2 138.3 129.6 139.1 Q 130.9 137.5 132.5 138.2 L 134.1 139.8 Q 133.4 141.7 130.4 140.7 Q 125.4 139.1 124 136 Z" />
            <path d="M 128.5 130 Q 131 128.8 133 130" opacity="0.9" />
          </g>

          {/* LOCATION: pin (bottom-right) */}
          <g stroke="#6B7280" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none">
            <path d="M 152 138 Q 152 134 155 134 Q 158 134 158 138 Q 158 141 155 144 Q 152 141 152 138 Z" />
            <circle cx="155" cy="138" r="1" />
          </g>

          {/* dotted connective paths between icons */}
          <path d="M 38 26 Q 48 18 60 18" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 72 20 Q 82 16 90 18" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 102 20 Q 112 18 124 24" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 136 34 Q 142 38 148 42" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 52 76 Q 62 70 74 68" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 82 68 Q 108 78 136 64" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 148 76 Q 158 74 162 78" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 16 90 Q 18 108 24 126" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 34 132 Q 48 140 62 142" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 74 144 Q 86 146 96 144" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 106 144 Q 114 142 122 138" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 136 140 Q 144 142 152 140" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M 160 146 Q 172 144 186 94" fill="none" stroke="#9CA3AF" strokeWidth="0.6" strokeDasharray="1.2 2.6" strokeLinecap="round" opacity="0.6" />
        </svg>
        <h3 className="relative z-10 text-[9px] font-black uppercase tracking-wider text-black mb-4">Connect</h3>
        <a
          href={`tel:${number.replace(/[^\d+]/g, '')}`}
          className="relative z-10 block bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl border-[1.5px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.25)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-[3px] transition-all px-4 py-3 mb-5 break-words"
        >
          {number}
        </a>
        <button
          onClick={onClose}
          className="relative z-10 w-10 h-10 mx-auto rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center border-[1.5px] border-black shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_2px_3px_rgba(255,255,255,0.25)] active:translate-y-[2px] active:shadow-[0_1px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default CallNumberPopup;
