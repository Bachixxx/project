import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>
  );
};

export default Loading;
