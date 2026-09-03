import React, { useState, useEffect, useRef } from 'react';
import logoImg from '../assets/images/arish_exact_logo_1787762978161.jpg';
import { ARISH_LOGO_DATA_URL } from '../assets/logoBase64';

interface ArishLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubText?: boolean;
  allowUpload?: boolean;
}

export const ArishLogo: React.FC<ArishLogoProps> = ({
  className = '',
  size = 'md',
  showSubText = false,
  allowUpload = false,
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('custom_arish_logo');
    } catch {
      return null;
    }
  });

  const [srcIndex, setSrcIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('custom_arish_logo');
        if (saved) setCustomLogo(saved);
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('custom_logo_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('custom_logo_updated', handleStorageChange);
    };
  }, []);

  const sources = [
    ...(customLogo ? [customLogo] : []),
    ARISH_LOGO_DATA_URL,
    logoImg,
    '/logo_arish.png',
    '/icon.png',
  ];

  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
    '2xl': 'w-64 h-64 sm:w-72 sm:h-72',
  };

  const handleImgError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex((prev) => prev + 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          localStorage.setItem('custom_arish_logo', base64);
          setCustomLogo(base64);
          setSrcIndex(0);
          window.dispatchEvent(new Event('custom_logo_updated'));
        } catch (err) {
          console.error('Failed to save to localStorage', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div
        onClick={allowUpload ? () => fileInputRef.current?.click() : undefined}
        title={allowUpload ? 'انقر لاختيار صورتك الأصلية مباشرة من جهازك' : undefined}
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-amber-400/80 bg-[#071228] select-none shrink-0 flex items-center justify-center ${
          allowUpload ? 'cursor-pointer hover:scale-105 hover:border-amber-300 transition-transform' : ''
        } ${sizeMap[size]}`}
      >
        <img
          src={sources[srcIndex] || ARISH_LOGO_DATA_URL}
          alt="ARISH EGGS - منتجات نهر اسطوان"
          className="w-full h-full object-contain"
          onError={handleImgError}
          loading="eager"
          decoding="sync"
        />
      </div>

      {showSubText && (
        <div className="flex flex-col">
          <span className="text-white font-black text-base tracking-tight font-['Cairo']">
            ARISH <span className="text-amber-400">EGGS</span>
          </span>
          <span className="text-amber-300 text-xs font-bold font-['Cairo']">
            منتجات نهر اسطوان
          </span>
        </div>
      )}
    </div>
  );
};
