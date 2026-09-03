import React from 'react';
import { ArishLogo } from './ArishLogo';
import { AutoSyncSettings } from '../types';
import {
  Search,
  Undo2,
  Redo2,
  Cloud,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount?: number;
  redoCount?: number;
  autoSyncSettings?: AutoSyncSettings;
  onOpenOneDriveModal: () => void;
  activeTab: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  undoCount = 0,
  redoCount = 0,
  autoSyncSettings,
  onOpenOneDriveModal,
}) => {
  const isSyncActive = autoSyncSettings?.enabled;
  const isSyncing = autoSyncSettings?.lastSyncStatus === 'syncing';

  return (
    <header className="bg-gradient-to-r from-[#071228] via-[#0D2149] to-[#16335D] text-white shadow-xl border-b border-amber-500/25 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Emblem Logo & Title */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-3">
              <ArishLogo size="md" allowUpload={true} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex flex-row items-center gap-1.5 font-['Cairo'] select-none" dir="ltr">
                  <span>ARISH</span> <span className="text-amber-400">EGGS</span>
                </h1>
              </div>
            </div>

            {/* Undo / Redo Mobile Controls */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-amber-300 transition-all cursor-pointer"
                title={`تراجع (Ctrl+Z) - متاح ${undoCount} خطوة`}
              >
                <Undo2 className="w-4 h-4" />
                {undoCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1 rounded-full">
                    {undoCount > 99 ? '99+' : undoCount}
                  </span>
                )}
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-amber-300 transition-all cursor-pointer"
                title={`إعادة (Ctrl+Y) - متاح ${redoCount} خطوة`}
              >
                <Redo2 className="w-4 h-4" />
                {redoCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1 rounded-full">
                    {redoCount > 99 ? '99+' : redoCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Action Center (Undo, Redo, Search, Cloud Sync) */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Desktop Undo & Redo */}
            <div className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                title={`تراجع عن الخطوة السابقة (Ctrl+Z) - متاح ${undoCount} خطوة`}
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>تراجع</span>
                {undoCount > 0 && (
                  <span className="bg-amber-400/25 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {undoCount}
                  </span>
                )}
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                title={`إعادة الخطوة (Ctrl+Y) - متاح ${redoCount} خطوة`}
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>إعادة</span>
                {redoCount > 0 && (
                  <span className="bg-amber-400/25 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {redoCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="بحث في الحركات..."
                className="w-full bg-white/10 text-white placeholder-slate-400 text-xs rounded-xl pr-8 pl-3 py-2 border border-white/15 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Cloud Sync & File Operations */}
            <button
              onClick={onOpenOneDriveModal}
              className={`flex items-center gap-2 font-bold px-3.5 py-2 rounded-xl text-xs border shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap group ${
                isSyncActive
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-[#0D2149] text-white border-emerald-400/50'
                  : 'bg-gradient-to-r from-[#0078D4] via-[#0284C7] to-[#0D2149] hover:from-[#0062AD] hover:to-[#1E3E62] text-white border-sky-300/40'
              }`}
              title={
                isSyncActive
                  ? `مزامنة فورية نشطة عند التعديل - آخر تحديث: ${autoSyncSettings?.lastSyncTime || 'الآن'}`
                  : 'مزامنة وتحديث فوري واستيراد وتصدير البيانات مع Excel و OneDrive'
              }
            >
              <div className="relative flex items-center justify-center">
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 text-emerald-200 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
                )}
                {isSyncActive ? (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping border border-[#071228]" />
                ) : null}
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="tracking-tight flex items-center gap-1">
                  <span>مزامنة سحابية</span>
                  {isSyncActive && (
                    <span className={`text-[10px] px-1 rounded-sm font-normal ${
                      autoSyncSettings?.hasPendingOfflineChanges
                        ? 'bg-amber-400/30 text-amber-200'
                        : 'bg-emerald-400/30 text-emerald-200'
                    }`}>
                      {autoSyncSettings?.hasPendingOfflineChanges ? 'بانتظار النت ⏳' : 'فورية 🟢'}
                    </span>
                  )}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
