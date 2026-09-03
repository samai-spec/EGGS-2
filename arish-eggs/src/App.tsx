import { useState, useEffect, useCallback, useRef } from 'react';
import { Transaction, FeedScheduleEntry, FormulasConfig, AppStateSnapshot, AutoSyncSettings } from './types';
import {
  loadStoredTransactions,
  saveStoredTransactions,
  loadStoredFarms,
  saveStoredFarms,
  loadStoredInitialBirds,
  saveStoredInitialBirds,
  loadStoredFeedSchedules,
  saveStoredFeedSchedules,
  loadStoredFormulasConfig,
  saveStoredFormulasConfig,
  loadStoredNotes,
  saveStoredNotes,
  loadStoredUndoStack,
  saveStoredUndoStack,
  loadStoredRedoStack,
  saveStoredRedoStack,
  loadStoredAutoSyncSettings,
  saveStoredAutoSyncSettings,
  STORAGE_KEYS,
  clearAllStorageData,
} from './utils/storage';
import {
  DEFAULT_FORMULAS_CONFIG,
  DEFAULT_NOTES_REFERENCE,
} from './utils/calculations';
import { Header } from './components/Header';
import { SplashScreen } from './components/SplashScreen';
import { DailyMovementsView } from './components/DailyMovementsView';
import { SummaryView } from './components/SummaryView';
import { ConstantsView } from './components/ConstantsView';
import { OneDriveSyncModal, SyncLogItem } from './components/OneDriveSyncModal';
import {
  ListChecks,
  BarChart3,
  Settings,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  // Navigation Tabs: 0 -> الحركات اليومية, 1 -> الملخص الإجمالي, 2 -> الثوابت والإعدادات
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isOneDriveModalOpen, setIsOneDriveModalOpen] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Core Data States (تصفير وبدون أمثلة افتراضية إذا كانت فارغة)
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStoredTransactions());
  const [farms, setFarms] = useState<string[]>(() => loadStoredFarms());
  const [initialBirds, setInitialBirds] = useState<Record<string, number>>(() => loadStoredInitialBirds());
  const [feedSchedules, setFeedSchedules] = useState<FeedScheduleEntry[]>(() => loadStoredFeedSchedules());
  const [formulasConfig, setFormulasConfig] = useState<FormulasConfig>(() => loadStoredFormulasConfig());
  const [notes, setNotes] = useState<string>(() => loadStoredNotes());

  // Cloud & OneDrive Auto-Sync State
  const [autoSyncSettings, setAutoSyncSettings] = useState<AutoSyncSettings>(() => loadStoredAutoSyncSettings());
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [nextSyncCountdownSeconds, setNextSyncCountdownSeconds] = useState<number>(
    () => (loadStoredAutoSyncSettings().intervalMinutes || 5) * 60
  );

  // Multi-step Undo & Redo History Stacks (Persistent up to 100 steps across app sessions)
  const [undoStack, setUndoStack] = useState<AppStateSnapshot[]>(() => loadStoredUndoStack());
  const [redoStack, setRedoStack] = useState<AppStateSnapshot[]>(() => loadStoredRedoStack());

  // Capture snapshot of entire current app state
  const getCurrentSnapshot = useCallback((): AppStateSnapshot => ({
    transactions,
    farms,
    initialBirds,
    feedSchedules,
    formulasConfig,
    notes,
    activeTab,
  }), [transactions, farms, initialBirds, feedSchedules, formulasConfig, notes, activeTab]);

  // Push current state into undo stack before mutating (stores up to 100 actions)
  const pushToUndo = useCallback(() => {
    const snap = getCurrentSnapshot();
    setUndoStack((prev) => [snap, ...prev].slice(0, 100));
    setRedoStack([]); // Clear redo stack on new action
  }, [getCurrentSnapshot]);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to LocalStorage
  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredFarms(farms);
  }, [farms]);

  useEffect(() => {
    saveStoredInitialBirds(initialBirds);
  }, [initialBirds]);

  useEffect(() => {
    saveStoredFeedSchedules(feedSchedules);
  }, [feedSchedules]);

  useEffect(() => {
    saveStoredFormulasConfig(formulasConfig);
  }, [formulasConfig]);

  useEffect(() => {
    saveStoredNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveStoredUndoStack(undoStack);
  }, [undoStack]);

  useEffect(() => {
    saveStoredRedoStack(redoStack);
  }, [redoStack]);

  useEffect(() => {
    saveStoredAutoSyncSettings(autoSyncSettings);
  }, [autoSyncSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_LOGS, JSON.stringify(syncLogs));
    } catch (e) {
      console.error('Failed to save sync logs', e);
    }
  }, [syncLogs]);

  // Cloud & OneDrive Auto-Sync Execution Engine
  const performAutoSync = useCallback(async (triggerType: 'auto_interval' | 'auto_edit' | 'manual' = 'auto_interval'): Promise<boolean> => {
    const webhookUrl = (localStorage.getItem('ARISH_ONEDRIVE_WEBHOOK_URL') || '').trim();
    const oneDriveUrl = (localStorage.getItem('ARISH_ONEDRIVE_FILE_URL') || '').trim();

    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // If neither URL is present
    if (!webhookUrl && !oneDriveUrl) {
      if (triggerType === 'manual') {
        showToast('يرجى حفظ رابط Webhook أو OneDrive أولاً');
      }
      return false;
    }

    // If browser is currently offline
    if (!navigator.onLine) {
      setAutoSyncSettings(prev => ({
        ...prev,
        lastSyncStatus: 'error',
        lastSyncMessage: 'لا يوجد اتصال بالإنترنت (محفوظ محلياً)',
        hasPendingOfflineChanges: true,
      }));
      const newLog: SyncLogItem = {
        id: 'log-' + Date.now(),
        time: timestamp,
        type: triggerType,
        status: 'error',
        rowCount: transactions.length,
        message: 'تم حفظ البيانات في المتصفح. بانتظار عودة الإنترنت لرفعها إلى OneDrive',
      };
      setSyncLogs(prev => [newLog, ...prev].slice(0, 10));
      return false;
    }

    try {
      setAutoSyncSettings(prev => ({ ...prev, lastSyncStatus: 'syncing' }));

      const payload = {
        app: 'ARISH EGGS',
        timestamp: new Date().toISOString(),
        triggerType,
        totalTransactions: transactions.length,
        transactions,
        farms,
        initialBirds,
        feedSchedules,
        formulasConfig,
      };

      if (webhookUrl) {
        const resp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          throw new Error(`استجابة الخادم: ${resp.status}`);
        }
      }

      const triggerName = triggerType === 'auto_edit' ? 'تحديث فوري عند التعديل' : 'تحديث يدوي';

      const newLog: SyncLogItem = {
        id: 'log-' + Date.now(),
        time: timestamp,
        type: triggerType,
        status: 'success',
        rowCount: transactions.length,
        message: `تم تحديث ملف OneDrive بنجاح (${triggerName})`,
      };

      setSyncLogs(prev => [newLog, ...prev].slice(0, 10));
      setAutoSyncSettings(prev => ({
        ...prev,
        lastSyncTime: timestamp,
        lastSyncStatus: 'success',
        lastSyncMessage: 'تم التحديث بنجاح',
        hasPendingOfflineChanges: false,
      }));

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const newLog: SyncLogItem = {
        id: 'log-' + Date.now(),
        time: timestamp,
        type: triggerType,
        status: 'error',
        rowCount: transactions.length,
        message: `تعذر الاتصال بـ OneDrive (${msg}) - محفوظة محلياً بالكامل`,
      };
      setSyncLogs(prev => [newLog, ...prev].slice(0, 10));
      setAutoSyncSettings(prev => ({
        ...prev,
        lastSyncStatus: 'error',
        lastSyncMessage: msg,
        hasPendingOfflineChanges: true,
      }));
      return false;
    }
  }, [transactions, farms, initialBirds, feedSchedules, formulasConfig]);

  // Online / Offline Auto-Recovery Listener: Automatically uploads all pending changes when connection is restored
  useEffect(() => {
    const handleOnline = () => {
      showToast('تم استعادة الاتصال بالإنترنت! جاري رفع ومزامنة البيانات...');
      if (autoSyncSettings.enabled) {
        performAutoSync('auto_edit');
      }
    };

    const handleOffline = () => {
      showToast('انقطع الاتصال بالإنترنت. كافة البيانات تُحفظ في جهازك وسيتم رفعها تلقائياً فور عودة الشبكة.');
      setAutoSyncSettings(prev => ({
        ...prev,
        hasPendingOfflineChanges: true,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSyncSettings.enabled, performAutoSync]);

  // Auto-Sync on Transaction or Data modification
  const lastSyncDebounce = useRef<NodeJS.Timeout | null>(null);
  const triggerSyncOnEdit = useCallback(() => {
    if (autoSyncSettings.enabled && autoSyncSettings.syncOnEdit) {
      if (!navigator.onLine) {
        setAutoSyncSettings(prev => ({ ...prev, hasPendingOfflineChanges: true }));
        return;
      }
      if (lastSyncDebounce.current) clearTimeout(lastSyncDebounce.current);
      lastSyncDebounce.current = setTimeout(() => {
        performAutoSync('auto_edit');
      }, 1500); // 1.5s debounce for fast consecutive edits
    }
  }, [autoSyncSettings.enabled, autoSyncSettings.syncOnEdit, performAutoSync]);

  // Comprehensive Undo Action across all pages and actions (up to 100 steps)
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const [previous, ...rest] = undoStack;
    const current = getCurrentSnapshot();

    setRedoStack((prev) => [current, ...prev].slice(0, 100));
    setUndoStack(rest);

    setTransactions(previous.transactions);
    setFarms(previous.farms);
    setInitialBirds(previous.initialBirds);
    setFeedSchedules(previous.feedSchedules);
    setFormulasConfig(previous.formulasConfig);
    setNotes(previous.notes);
    setActiveTab(previous.activeTab);

    showToast('تم التراجع عن الخطوة السابقة');
  }, [undoStack, getCurrentSnapshot]);

  // Comprehensive Redo Action (up to 100 steps)
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const [nextState, ...rest] = redoStack;
    const current = getCurrentSnapshot();

    setUndoStack((prev) => [current, ...prev].slice(0, 100));
    setRedoStack(rest);

    setTransactions(nextState.transactions);
    setFarms(nextState.farms);
    setInitialBirds(nextState.initialBirds);
    setFeedSchedules(nextState.feedSchedules);
    setFormulasConfig(nextState.formulasConfig);
    setNotes(nextState.notes);
    setActiveTab(nextState.activeTab);

    showToast('تمت إعادة الخطوة');
  }, [redoStack, getCurrentSnapshot]);

  // Global Keyboard Shortcuts (Ctrl+Z for Undo, Ctrl+Y / Ctrl+Shift+Z for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Transaction CRUD handlers
  const handleAddTransaction = (newTrData: Omit<Transaction, 'id'>) => {
    pushToUndo();
    const newTr: Transaction = {
      ...newTrData,
      id: 'tr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    };
    // New entries are added to top
    setTransactions((prev) => [newTr, ...prev]);

    // If new farm used, register it automatically
    if (newTrData.farm && newTrData.farm !== 'عام' && !farms.includes(newTrData.farm)) {
      setFarms((prev) => [...prev, newTrData.farm]);
      setInitialBirds((prev) => ({ ...prev, [newTrData.farm]: 0 }));
    }

    triggerSyncOnEdit();
    showToast('تمت إضافة الحركة للجدول بنجاح');
  };

  const handleInsertTransaction = (targetId: string, position: 'above' | 'below', newTrData: Omit<Transaction, 'id'>) => {
    pushToUndo();
    const newTr: Transaction = {
      ...newTrData,
      id: 'tr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    };

    setTransactions((prev) => {
      const index = prev.findIndex((t) => t.id === targetId);
      if (index === -1) {
        return position === 'above' ? [newTr, ...prev] : [...prev, newTr];
      }
      const updated = [...prev];
      if (position === 'above') {
        updated.splice(index, 0, newTr);
      } else {
        updated.splice(index + 1, 0, newTr);
      }
      return updated;
    });

    if (newTrData.farm && newTrData.farm !== 'عام' && !farms.includes(newTrData.farm)) {
      setFarms((prev) => [...prev, newTrData.farm]);
      setInitialBirds((prev) => ({ ...prev, [newTrData.farm]: 0 }));
    }

    triggerSyncOnEdit();
    showToast(position === 'above' ? 'تم إدراج سطر للأعلى' : 'تم إدراج سطر للأسفل');
  };

  const handleUpdateTransaction = (id: string, updated: Partial<Transaction>) => {
    pushToUndo();
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
    triggerSyncOnEdit();
  };

  const handleDeleteTransaction = (id: string) => {
    pushToUndo();
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    triggerSyncOnEdit();
    showToast('تم حذف السطر');
  };

  // Import handler with Append (default) or Replace mode
  const handleImportTransactions = (imported: Transaction[], replaceAll = false) => {
    pushToUndo();
    if (replaceAll) {
      setTransactions(imported);
    } else {
      // Append new imported rows to the top
      setTransactions((prev) => [...imported, ...prev]);
    }

    // Auto extract any new farms
    const newFarmsFound = new Set<string>();
    imported.forEach((t) => {
      if (t.farm && t.farm !== 'عام' && !farms.includes(t.farm)) {
        newFarmsFound.add(t.farm);
      }
    });

    if (newFarmsFound.size > 0) {
      setFarms((prev) => [...prev, ...Array.from(newFarmsFound)]);
    }

    triggerSyncOnEdit();
  };

  // Farms Management
  const handleAddNewFarm = (farmName: string) => {
    if (!farms.includes(farmName)) {
      pushToUndo();
      setFarms((prev) => [...prev, farmName]);
      setInitialBirds((prev) => ({ ...prev, [farmName]: 0 }));
      triggerSyncOnEdit();
      showToast(`تمت إضافة: ${farmName}`);
    }
  };

  const handleDeleteFarm = (farmName: string) => {
    pushToUndo();
    setFarms((prev) => prev.filter((f) => f !== farmName));
    setInitialBirds((prev) => {
      const next = { ...prev };
      delete next[farmName];
      return next;
    });
    setFeedSchedules((prev) => prev.filter((s) => s.farm !== farmName));
    triggerSyncOnEdit();
    showToast(`تم حذف: ${farmName}`);
  };

  const handleResetAllAppData = () => {
    pushToUndo();
    setTransactions([]);
    setFarms([]);
    setInitialBirds({});
    setFeedSchedules([]);
    setNotes('');
    setFormulasConfig(DEFAULT_FORMULAS_CONFIG);
    clearAllStorageData();
    showToast('تم تصفير وحذف جميع بيانات التطبيق بنجاح');
  };

  const handleUpdateInitialBirds = (farm: string, count: number) => {
    pushToUndo();
    setInitialBirds((prev) => ({ ...prev, [farm]: count }));
    triggerSyncOnEdit();
  };

  // Feed Schedules Management
  const handleAddFeedSchedule = (schedule: Omit<FeedScheduleEntry, 'id'>) => {
    pushToUndo();
    const newEntry: FeedScheduleEntry = {
      ...schedule,
      id: 'fs-' + Date.now(),
    };
    setFeedSchedules((prev) => [...prev, newEntry]);
    triggerSyncOnEdit();
    showToast('تمت إضافة جدول استهلاك العلف');
  };

  const handleDeleteFeedSchedule = (id: string) => {
    pushToUndo();
    setFeedSchedules((prev) => prev.filter((s) => s.id !== id));
    triggerSyncOnEdit();
    showToast('تم حذف جدول العلف');
  };

  const handleUpdateFeedSchedule = (id: string, updated: Partial<FeedScheduleEntry>) => {
    pushToUndo();
    setFeedSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
    triggerSyncOnEdit();
  };

  const handleUpdateFormulasConfig = (cfg: Partial<FormulasConfig>) => {
    pushToUndo();
    setFormulasConfig((prev) => ({ ...prev, ...cfg }));
    triggerSyncOnEdit();
    showToast('تم حفظ تعديلات نسب المعادلات');
  };

  const handleUpdateNotes = (newNotes: string) => {
    pushToUndo();
    setNotes(newNotes);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-['Cairo',sans-serif]">
      
      {/* Initial Startup / Splash Screen */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* App Main Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        undoCount={undoStack.length}
        redoCount={redoStack.length}
        autoSyncSettings={autoSyncSettings}
        onOpenOneDriveModal={() => setIsOneDriveModalOpen(true)}
        activeTab={activeTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 pb-24">
        {activeTab === 0 && (
          <DailyMovementsView
            transactions={transactions}
            farms={farms}
            formulasConfig={formulasConfig}
            searchQuery={searchQuery}
            onAddTransaction={handleAddTransaction}
            onInsertTransaction={handleInsertTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 1 && (
          <SummaryView
            transactions={transactions}
            farms={farms}
            initialBirds={initialBirds}
            feedSchedules={feedSchedules}
            formulasConfig={formulasConfig}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 2 && (
          <ConstantsView
            farms={farms}
            initialBirds={initialBirds}
            feedSchedules={feedSchedules}
            formulasConfig={formulasConfig}
            notes={notes}
            onAddFarm={handleAddNewFarm}
            onDeleteFarm={handleDeleteFarm}
            onUpdateInitialBirds={handleUpdateInitialBirds}
            onAddFeedSchedule={handleAddFeedSchedule}
            onDeleteFeedSchedule={handleDeleteFeedSchedule}
            onUpdateFeedSchedule={handleUpdateFeedSchedule}
            onUpdateFormulasConfig={handleUpdateFormulasConfig}
            onUpdateNotes={handleUpdateNotes}
            onResetToDefaults={() => {
              pushToUndo();
              setFormulasConfig(DEFAULT_FORMULAS_CONFIG);
              setNotes(DEFAULT_NOTES_REFERENCE);
              showToast('تمت استعادة القيم الافتراضية');
            }}
            onResetAllAppData={handleResetAllAppData}
          />
        )}
      </main>

      {/* Navigation Tabs Bar - Fixed at Bottom (موزعة على كامل عرض الشاشة بسلاسة) */}
      <div className="bg-[#0B192C] border-t border-amber-400/20 fixed bottom-0 left-0 right-0 z-40 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <nav className="grid grid-cols-3 gap-1.5 sm:gap-3 py-1.5 w-full">
            
            {/* Tab 1: الحركات اليومية */}
            <button
              onClick={() => setActiveTab(0)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 w-full py-2.5 px-1 sm:px-4 text-xs sm:text-sm font-bold border-t-2 rounded-t-xl transition-all cursor-pointer ${
                activeTab === 0
                  ? 'border-amber-400 text-amber-400 bg-white/10 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <ListChecks className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">الحركات اليومية</span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                {transactions.length}
              </span>
            </button>

            {/* Tab 2: الملخص الإجمالي */}
            <button
              onClick={() => setActiveTab(1)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 w-full py-2.5 px-1 sm:px-4 text-xs sm:text-sm font-bold border-t-2 rounded-t-xl transition-all cursor-pointer ${
                activeTab === 1
                  ? 'border-amber-400 text-amber-400 bg-white/10 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">الملخص الإجمالي</span>
            </button>

            {/* Tab 3: الثوابت والإعدادات */}
            <button
              onClick={() => setActiveTab(2)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 w-full py-2.5 px-1 sm:px-4 text-xs sm:text-sm font-bold border-t-2 rounded-t-xl transition-all cursor-pointer ${
                activeTab === 2
                  ? 'border-amber-400 text-amber-400 bg-white/10 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">الثوابت والإعدادات</span>
            </button>
          </nav>
        </div>
      </div>

      {/* OneDrive & Cloud Excel Sync Modal */}
      <OneDriveSyncModal
        isOpen={isOneDriveModalOpen}
        onClose={() => setIsOneDriveModalOpen(false)}
        transactions={transactions}
        farms={farms}
        initialBirds={initialBirds}
        feedSchedules={feedSchedules}
        formulasConfig={formulasConfig}
        autoSyncSettings={autoSyncSettings}
        onUpdateAutoSyncSettings={setAutoSyncSettings}
        onTriggerSync={(manual) => performAutoSync(manual ? 'manual' : 'auto_interval')}
        syncLogs={syncLogs}
        nextSyncCountdownSeconds={nextSyncCountdownSeconds}
        onImportTransactions={handleImportTransactions}
        onShowToast={showToast}
      />

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-16 left-5 z-50 flex items-center gap-2 bg-[#0D2149] text-amber-300 text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-amber-400/40 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

