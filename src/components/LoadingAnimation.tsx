import React from 'react';

interface LoadingAnimationProps {
  message?: string;
  className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = "Loading...",
  className = ""
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 ${className}`}>
      <div className="text-center w-full max-w-2xl mx-auto flex flex-col items-center justify-center">
        {/* Business Model Loading Animation */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-lg sm:shadow-xl flex flex-col items-center justify-center w-full mx-auto">
          <svg viewBox="0 0 500 280" className="w-full h-[200px] sm:h-[250px] mx-auto mb-4 sm:mb-6" preserveAspectRatio="xMidYMid meet">
            {/* Step 1: User Posting Enquiry */}
            <g id="step1" transform="translate(80, 80)">
              {/* User Character */}
              <g>
                <circle cx="0" cy="-25" r="20" fill="none" stroke="#1F2937" strokeWidth="2.5">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-4; 0,0" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="-8" cy="-32" r="3" fill="#1F2937"/>
                <circle cx="8" cy="-32" r="3" fill="#1F2937"/>
                <path d="M-8,-18 Q0,-14 8,-18" stroke="#1F2937" strokeWidth="2" fill="none"/>
                <ellipse cx="0" cy="5" rx="15" ry="25" fill="none" stroke="#1F2937" strokeWidth="2.5"/>
              </g>
              
              {/* Enquiry Card appearing */}
              <g transform="translate(40, -10)">
                <rect x="0" y="0" width="0" height="35" rx="4" fill="#F9FAFB" stroke="#1F2937" strokeWidth="2">
                  <animate attributeName="width" values="0;50;50;50" dur="4s" repeatCount="indefinite" begin="0s"/>
                </rect>
                <line x1="5" y1="8" x2="0" y2="8" stroke="#1F2937" strokeWidth="1.5" opacity="0">
                  <animate attributeName="x2" values="0;40;40;40" dur="4s" repeatCount="indefinite" begin="0.5s"/>
                  <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="0.5s"/>
                </line>
                <line x1="5" y1="18" x2="0" y2="18" stroke="#1F2937" strokeWidth="1.5" opacity="0">
                  <animate attributeName="x2" values="0;35;35;35" dur="4s" repeatCount="indefinite" begin="0.8s"/>
                  <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="0.8s"/>
                </line>
              </g>
              
              {/* Loading spinner */}
              <circle cx="0" cy="-25" r="30" fill="none" stroke="#E5E7EB" strokeWidth="2"/>
              <circle cx="0" cy="-25" r="30" fill="none" stroke="#1F2937" strokeWidth="2" 
                strokeDasharray="47 94" transform="rotate(-90 0 -25)" opacity="0">
                <animateTransform attributeName="transform" type="rotate" values="-90 0 -25; 270 0 -25" dur="1.5s" repeatCount="indefinite" begin="0s"/>
                <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="0s"/>
              </circle>
            </g>
            
            {/* Arrow 1 - Animated */}
            <g transform="translate(170, 125)">
              <line x1="0" y1="0" x2="70" y2="0" stroke="#1F2937" strokeWidth="3" opacity="0">
                <animate attributeName="stroke-dasharray" values="0,200;70,0;0,0" dur="1.5s" repeatCount="indefinite" begin="1.5s"/>
                <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="1.5s"/>
              </line>
              <polygon points="75,0 62,-6 62,6" fill="#1F2937" opacity="0">
                <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="1.5s"/>
              </polygon>
            </g>
            
            {/* Step 2: AI Matching */}
            <g id="step2" transform="translate(260, 80)">
              {/* AI Box */}
              <rect x="-30" y="-30" width="60" height="60" rx="8" fill="none" stroke="#1F2937" strokeWidth="3" opacity="0">
                <animateTransform attributeName="transform" type="scale" values="0.8;1;1;1" dur="4s" repeatCount="indefinite" begin="2s"/>
                <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="2s"/>
              </rect>
              <rect x="-22" y="-22" width="44" height="44" fill="#F9FAFB" opacity="0">
                <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="2s"/>
              </rect>
              
              {/* Brain Nodes */}
              <circle cx="0" cy="-10" r="6" fill="#1F2937" opacity="0">
                <animate attributeName="opacity" values="0;0.6;1;0.6;0" dur="4s" repeatCount="indefinite" begin="2.2s"/>
                <animate attributeName="r" values="6;7;6" dur="1s" repeatCount="indefinite" begin="2.2s"/>
              </circle>
              <circle cx="-12" cy="0" r="5" fill="#1F2937" opacity="0">
                <animate attributeName="opacity" values="0;0.6;1;0.6;0" dur="4s" repeatCount="indefinite" begin="2.4s"/>
                <animate attributeName="r" values="5;6;5" dur="1s" repeatCount="indefinite" begin="2.4s"/>
              </circle>
              <circle cx="12" cy="0" r="5" fill="#1F2937" opacity="0">
                <animate attributeName="opacity" values="0;0.6;1;0.6;0" dur="4s" repeatCount="indefinite" begin="2.6s"/>
                <animate attributeName="r" values="5;6;5" dur="1s" repeatCount="indefinite" begin="2.6s"/>
              </circle>
              <circle cx="0" cy="10" r="6" fill="#1F2937" opacity="0">
                <animate attributeName="opacity" values="0;0.6;1;0.6;0" dur="4s" repeatCount="indefinite" begin="2.8s"/>
                <animate attributeName="r" values="6;7;6" dur="1s" repeatCount="indefinite" begin="2.8s"/>
              </circle>
              
              {/* Connecting lines */}
              <line x1="-12" y1="0" x2="0" y2="-10" stroke="#1F2937" strokeWidth="2" opacity="0">
                <animate attributeName="opacity" values="0;0.5;0.5;0" dur="4s" repeatCount="indefinite" begin="2.5s"/>
              </line>
              <line x1="12" y1="0" x2="0" y2="-10" stroke="#1F2937" strokeWidth="2" opacity="0">
                <animate attributeName="opacity" values="0;0.5;0.5;0" dur="4s" repeatCount="indefinite" begin="2.7s"/>
              </line>
            </g>
            
            {/* Arrow 2 */}
            <g transform="translate(330, 125)">
              <line x1="0" y1="0" x2="70" y2="0" stroke="#1F2937" strokeWidth="3" opacity="0">
                <animate attributeName="stroke-dasharray" values="0,200;70,0;0,0" dur="1.5s" repeatCount="indefinite" begin="3.5s"/>
                <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="3.5s"/>
              </line>
              <polygon points="75,0 62,-6 62,6" fill="#1F2937" opacity="0">
                <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="3.5s"/>
              </polygon>
            </g>
            
            {/* Step 3: Multiple Sellers */}
            <g id="step3" transform="translate(420, 80)">
              <g transform="translate(-25, 0)" opacity="0">
                <circle cx="0" cy="0" r="18" fill="none" stroke="#1F2937" strokeWidth="2.5">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="2s" repeatCount="indefinite" begin="4s"/>
                  <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="4s"/>
                </circle>
                <circle cx="-6" cy="-6" r="2.5" fill="#1F2937"/>
                <circle cx="6" cy="-6" r="2.5" fill="#1F2937"/>
                <path d="M-8,8 Q0,5 8,8" stroke="#1F2937" strokeWidth="2" fill="none"/>
              </g>
              <g transform="translate(0, 0)" opacity="0">
                <circle cx="0" cy="0" r="18" fill="none" stroke="#1F2937" strokeWidth="2.5">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="2s" repeatCount="indefinite" begin="4.3s"/>
                  <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="4.3s"/>
                </circle>
                <circle cx="-6" cy="-6" r="2.5" fill="#1F2937"/>
                <circle cx="6" cy="-6" r="2.5" fill="#1F2937"/>
                <path d="M-8,8 Q0,5 8,8" stroke="#1F2937" strokeWidth="2" fill="none"/>
              </g>
              <g transform="translate(25, 0)" opacity="0">
                <circle cx="0" cy="0" r="18" fill="none" stroke="#1F2937" strokeWidth="2.5">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="2s" repeatCount="indefinite" begin="4.6s"/>
                  <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="4.6s"/>
                </circle>
                <circle cx="-6" cy="-6" r="2.5" fill="#1F2937"/>
                <circle cx="6" cy="-6" r="2.5" fill="#1F2937"/>
                <path d="M-8,8 Q0,5 8,8" stroke="#1F2937" strokeWidth="2" fill="none"/>
              </g>
            </g>
            
            {/* Success Checkmark */}
            <g transform="translate(250, 180)" opacity="0">
              <circle cx="0" cy="0" r="25" fill="#1F2937" opacity="0.8">
                <animate attributeName="opacity" values="0;0.8;0.8;0" dur="4s" repeatCount="indefinite" begin="6.5s"/>
                <animate attributeName="r" values="25;28;25" dur="1.5s" repeatCount="indefinite" begin="6.5s"/>
              </circle>
              <path d="M-10,-3 L-3,8 L10,-8" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="6.5s"/>
                <animateTransform attributeName="transform" type="scale" values="0;1;1;0" dur="4s" repeatCount="indefinite" begin="6.5s"/>
              </path>
            </g>
            
            {/* Loading Progress Bar */}
            <g transform="translate(100, 240)">
              <rect x="0" y="0" width="300" height="6" rx="3" fill="#E5E7EB"/>
              <rect x="0" y="0" width="0" height="6" rx="3" fill="#1F2937">
                <animate attributeName="width" values="0;75;150;225;300;300" dur="8s" repeatCount="indefinite"/>
              </rect>
            </g>
          </svg>
          <p className="text-base sm:text-xl text-slate-700 font-semibold text-center tracking-tight">
            {message}
            <span className="inline-block animate-pulse">...</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;

