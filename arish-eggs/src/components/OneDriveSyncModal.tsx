import React, { useState, useRef, useEffect } from 'react';
import { Transaction, FeedScheduleEntry, FormulasConfig, AutoSyncSettings } from '../types';
import { exportToNativeExcelXLSX, parseExcelFile, parseCSVOrTableText } from '../utils/excelExport';
import { exportToCSV } from '../utils/storage';
import {
  Cloud,
  FileSpreadsheet,
  Upload,
  Download,
  ExternalLink,
  Link,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ClipboardPaste,
  FileText,
  Zap,
  Copy,
  Check,
  History,
} from 'lucide-react';

export interface SyncLogItem {
  id: string;
  time: string;
  type: 'auto_interval' | 'auto_edit' | 'manual';
  status: 'success' | 'error' | 'syncing';
  rowCount: number;
  message: string;
}

interface OneDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  farms: string[];
  initialBirds: Record<string, number>;
  feedSchedules: FeedScheduleEntry[];
  formulasConfig: FormulasConfig;
  autoSyncSettings: AutoSyncSettings;
  onUpdateAutoSyncSettings: (settings: AutoSyncSettings) => void;
  onTriggerSync: (manual?: boolean) => Promise<boolean>;
  syncLogs: SyncLogItem[];
  nextSyncCountdownSeconds: number;
  onImportTransactions: (transactions: Transaction[], replaceAll?: boolean) => void;
  onShowToast: (msg: string) => void;
}

export const OneDriveSyncModal: React.FC<OneDriveSyncModalProps> = ({
  isOpen,
  onClose,
  transactions,
  farms,
  initialBirds,
  feedSchedules,
  formulasConfig,
  autoSyncSettings,
  onUpdateAutoSyncSettings,
  onTriggerSync,
  syncLogs,
  nextSyncCountdownSeconds,
  onImportTransactions,
  onShowToast,
}) => {
  const [oneDriveLink, setOneDriveLink] = useState<string>(() => {
    return localStorage.getItem('ARISH_ONEDRIVE_FILE_URL') || '';
  });
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('ARISH_ONEDRIVE_WEBHOOK_URL') || '';
  });
  
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);
  
  // Import Mode: 'append' (default - إضافة أسطر جديدة) vs 'replace' (استبدال كافة البيانات)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOneDriveLink(localStorage.getItem('ARISH_ONEDRIVE_FILE_URL') || '');
    setWebhookUrl(localStorage.getItem('ARISH_ONEDRIVE_WEBHOOK_URL') || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrls = () => {
    localStorage.setItem('ARISH_ONEDRIVE_FILE_URL', oneDriveLink.trim());
    localStorage.setItem('ARISH_ONEDRIVE_WEBHOOK_URL', webhookUrl.trim());
    onShowToast('تم حفظ إعدادات الروابط بنجاح!');
  };

  const handleToggleAutoSync = () => {
    const nextState = !autoSyncSettings.enabled;
    if (nextState && !webhookUrl.trim() && !oneDriveLink.trim()) {
      alert('يرجى أولاً إدخال رابط Webhook أو رابط OneDrive في الحقل المخصص أدناه لتفعيل التحديث التلقائي.');
      return;
    }
    const updated = {
      ...autoSyncSettings,
      enabled: nextState,
      syncOnEdit: true,
    };
    onUpdateAutoSyncSettings(updated);
    onShowToast(nextState ? 'تم تفعيل التحديث الفوري التلقائي لـ OneDrive' : 'تم إيقاف التحديث التلقائي');
  };

  const handleManualSyncNow = async () => {
    setIsManualSyncing(true);
    handleSaveUrls();
    const success = await onTriggerSync(true);
    setIsManualSyncing(false);
    if (success) {
      onShowToast('تم تحديث ومزامنة ملف OneDrive بنجاح!');
    }
  };

  const handleExportXlsx = () => {
    exportToNativeExcelXLSX({
      transactions,
      farms,
      initialBirds,
      feedSchedules,
      formulasConfig,
    });
    onShowToast('تم تنزيل مصنف Excel (.xlsx) في مجلد التنزيلات (Downloads)');
  };

  const handleExportCSV = () => {
    exportToCSV(transactions, formulasConfig);
    onShowToast('تم تنزيل ملف CSV في مجلد التنزيلات (Downloads)');
  };

  const handleOpenOneDriveWeb = () => {
    if (oneDriveLink.trim()) {
      window.open(oneDriveLink.trim(), '_blank');
    } else {
      window.open('https://onedrive.live.com', '_blank');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    parseExcelFile(
      file,
      (data) => {
        if (data.transactions && data.transactions.length > 0) {
          const replaceAll = importMode === 'replace';
          onImportTransactions(data.transactions, replaceAll);
          onShowToast(
            replaceAll
              ? `تم استبدال البيانات واستيراد ${data.transactions.length} حركة بنجاح!`
              : `تمت إضافة ${data.transactions.length} حركة جديدة إلى الجدول!`
          );
          onClose();
        }
      },
      (err) => {
        alert(err);
      }
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleParsePastedData = () => {
    if (!pastedText.trim()) {
      alert('يرجى لصق نص الجدول أولاً');
      return;
    }

    parseCSVOrTableText(
      pastedText,
      (data) => {
        if (data.transactions && data.transactions.length > 0) {
          const replaceAll = importMode === 'replace';
          onImportTransactions(data.transactions, replaceAll);
          onShowToast(
            replaceAll
              ? `تم استبدال البيانات بـ ${data.transactions.length} حركة من النص!`
              : `تمت إضافة ${data.transactions.length} حركة جديدة من النص المنسوخ!`
          );
          setPastedText('');
          setShowPasteBox(false);
          onClose();
        }
      },
      (err) => {
        alert(err);
      }
    );
  };

  const jsonSampleSchema = `{
  "app": "ARISH EGGS",
  "timestamp": "${new Date().toISOString()}",
  "totalTransactions": ${transactions.length},
  "transactions": [ ...${transactions.length} صفوف مع كامل الأعمدة... ]
}`;

  const copySamplePayload = () => {
    navigator.clipboard.writeText(jsonSampleSchema);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
    onShowToast('تم نسخ نموذج البيانات إلى الحافظة');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Hidden file input for Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls,.csv,.txt"
        className="hidden"
      />

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden text-slate-800 text-right font-['Cairo'] flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0078D4] via-[#0D2149] to-[#071228] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 relative">
              <Cloud className="w-6 h-6 text-sky-300" />
              {autoSyncSettings.enabled && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>المزامنة السحابية والتحديث التلقائي لـ OneDrive</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                  autoSyncSettings.enabled
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                    : 'bg-sky-400/20 text-sky-200 border-sky-300/30'
                }`}>
                  {autoSyncSettings.enabled ? '🟢 تحديث فوري مفعّل' : 'OneDrive & Excel'}
                </span>
              </h2>
              <p className="text-xs text-sky-100/90 mt-0.5">
                تحديث فوري تلقائي لملف Excel على OneDrive عند أي تعديل بالجدول مع خيارات التصدير والاستيراد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs flex-1">
          
          {/* SECTION 1: Automatic Periodic Synchronization Control Card */}
          <div className="bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50/40 rounded-2xl p-4 sm:p-5 border border-sky-200 shadow-2xs space-y-4">
            
            {/* Header & Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-sky-200/80">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl text-white ${autoSyncSettings.enabled ? 'bg-emerald-600' : 'bg-[#0078D4]'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>التحديث الفوري والتلقائي لملف Excel على OneDrive</span>
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    تحديث ومزامنة فورية وتلقائية لملف الإكسل فور إضافة أو تعديل أو حذف أي حركة بالجدول
                  </p>
                </div>
              </div>

              {/* Main Toggle Switch */}
              <button
                onClick={handleToggleAutoSync}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                  autoSyncSettings.enabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoSyncSettings.enabled ? 'animate-spin' : ''}`} />
                <span>{autoSyncSettings.enabled ? 'التحديث الفوري: مفعّل 🟢' : 'تفعيل التحديث الفوري'}</span>
              </button>
            </div>

            {/* Instant Sync Status Box */}
            <div className="bg-white p-3 rounded-xl border border-sky-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2 text-slate-700">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  autoSyncSettings.hasPendingOfflineChanges
                    ? 'bg-amber-500 animate-ping'
                    : autoSyncSettings.enabled
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`} />
                <span className="font-bold text-slate-800">
                  {autoSyncSettings.hasPendingOfflineChanges
                    ? 'الإنترنت مقطوع: الحركات محفوظة محلياً بالكامل وسيتم رفعها تلقائياً فور عودة الشبكة 💾'
                    : autoSyncSettings.enabled
                    ? 'النظام يرسل التحديثات لـ OneDrive تلقائياً وفوراً عند أي تعديل'
                    : 'التحديث الفوري متوقف حالياً'}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                آخر تحديث مرسل: <strong className="text-slate-800 font-mono">{autoSyncSettings.lastSyncTime || 'لم يتم بعد'}</strong>
              </div>
            </div>

            {/* Webhook & OneDrive Endpoints inputs */}
            <div className="space-y-2 pt-1 bg-white/80 p-3.5 rounded-xl border border-sky-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Link className="w-3.5 h-3.5 text-indigo-600" />
                  <span>رابط Webhook / Power Automate لملف Excel على OneDrive:</span>
                </div>
                <button
                  type="button"
                  onClick={copySamplePayload}
                  className="flex items-center gap-1 text-[10px] bg-white text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-200 hover:bg-indigo-50 active:scale-95 transition-all cursor-pointer font-bold shadow-2xs"
                  title="نسخ نموذج هيكل البيانات المرسلة"
                >
                  {copiedSchema ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSchema ? 'تم النسخ' : 'نسخ هيكل البيانات (JSON Schema)'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://prod-XX.logic.azure.com/workflows/... أو رابط Webhook مخصص"
                  className="flex-1 bg-white text-slate-800 text-xs rounded-xl px-3 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono"
                  dir="ltr"
                />
                <button
                  onClick={handleSaveUrls}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer shrink-0"
                >
                  حفظ الرابط
                </button>
                <button
                  onClick={handleManualSyncNow}
                  disabled={isManualSyncing}
                  className="bg-[#0078D4] hover:bg-[#0062AD] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  {isManualSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-sky-200" />
                  )}
                  <span>تحديث الآن فوراً</span>
                </button>
              </div>

              {/* Direct OneDrive Link */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-[11px]">
                <span className="text-slate-600 font-bold shrink-0">رابط المشاركة السريع (OneDrive Web):</span>
                <input
                  type="url"
                  value={oneDriveLink}
                  onChange={(e) => setOneDriveLink(e.target.value)}
                  placeholder="https://1drv.ms/... رابط المجلد أو الملف على OneDrive للفتح المباشر"
                  className="flex-1 bg-white text-slate-800 text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0078D4]"
                  dir="ltr"
                />
                <button
                  onClick={handleOpenOneDriveWeb}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-[#0078D4] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <span>فتح في المتصفح</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Sync History / Recent Logs */}
            {syncLogs.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                  <div className="flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>سجل آخر عمليات التحديث الدوري:</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">آخر {syncLogs.length} عمليات</span>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-24 overflow-y-auto text-[11px]">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : log.status === 'syncing' ? (
                          <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span className="font-mono text-slate-700 font-bold">{log.time}</span>
                        <span className="text-slate-600">{log.message}</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                        {log.rowCount} حركة
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Instant Manual Export (.xlsx & .csv) */}
          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs sm:text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>تصدير فوري وتحميل مصنف Excel (.xlsx) على جهازك</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                تصدير يدوي
              </span>
            </div>
            <p className="text-slate-600 text-[11px]">
              تحميل مصنف Excel رسمي كامل المعادلات والترتيب، متطابق 100% مع Microsoft Excel ومجلد التنزيلات.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleExportXlsx}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-200" />
                <span>تحميل مصنف Excel أصلي (.xlsx)</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>تحميل ملف CSV</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: Import Excel / CSV */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-950 text-xs sm:text-sm">
                <Upload className="w-4 h-4 text-[#0078D4]" />
                <span>استيراد وتحديث البيانات من ملف Excel خارجي</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                استيراد ذكي
              </span>
            </div>

            {/* Import Mode Radio */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">طريقة الاستيراد:</span>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-emerald-900">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="accent-emerald-700"
                  />
                  <span>إضافة الحركات كأسطر جديدة في الأعلى (الافتراضي)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-rose-900">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-rose-700"
                  />
                  <span>استبدال كافة البيانات الحالية</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPasteBox(!showPasteBox)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-slate-700" />
                <span>{showPasteBox ? 'إخفاء خانة اللصق' : 'لصق نص الجدول المنسوخ'}</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0078D4] hover:bg-[#0062AD] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-sky-200" />
                <span>رفع ملف (.xlsx / .csv)</span>
              </button>
            </div>

            {/* Direct Paste Box */}
            {showPasteBox && (
              <div className="pt-2 space-y-2 border-t border-slate-200 animate-in fade-in duration-200">
                <p className="text-slate-600 text-[11px]">
                  الصق أسطر الجدول المنسوخة من Excel أو ملف CSV:
                </p>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="التاريخ;المزرعة;الصنف;الكمية;الوحدة;السعر;وحدة السعر;المصروف;المدخول;ملاحظات..."
                  className="w-full bg-white text-slate-900 font-mono text-[11px] p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                  dir="ltr"
                />
                <button
                  onClick={handleParsePastedData}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>معالجة واستيراد البيانات الآن</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>متوافق بنسبة 100% مع Microsoft OneDrive و Office 365 و Excel Online</span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-2 rounded-xl text-xs transition-all cursor-pointer w-full sm:w-auto"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
