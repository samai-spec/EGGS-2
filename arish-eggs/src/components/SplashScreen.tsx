import React, { useEffect, useState } from 'react';
import { ArishLogo } from './ArishLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show pure logo for 1.8 seconds then smoothly fade transition into the app
    const timer = setTimeout(() => {
      handleExit();
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handleExit = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 450);
  };

  return (
    <div
      onClick={handleExit}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#050D1C] via-[#0D2149] to-[#071228] text-white select-none transition-opacity duration-500 cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Pure Logo Only - No text, no buttons */}
      <div className="relative group animate-in fade-in zoom-in-95 duration-700">
        <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 rounded-full blur-md opacity-30 animate-pulse pointer-events-none" />
        <ArishLogo size="2xl" />
      </div>
    </div>
  );
};
