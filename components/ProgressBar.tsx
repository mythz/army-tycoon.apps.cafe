
import React from 'react';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const cappedPercentage = Math.min(100, Math.max(0, percentage));
  return (
    <div className="w-full bg-base-100 rounded-full h-4 shadow-inner overflow-hidden border border-base-300">
      <div
        className="bg-secondary h-4 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${cappedPercentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
