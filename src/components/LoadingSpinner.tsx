import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

