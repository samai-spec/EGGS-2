import React, { useState } from 'react';
import { FeedScheduleEntry, FormulasConfig } from '../types';
import {
  Plus,
  Trash2,
  Settings,
  Wheat,
  Activity,
  StickyNote,
  Sliders,
  Sparkles,
  AlertTriangle,
  Calculator,
  Check,
  Calendar,
} from 'lucide-react';

interface ConstantsViewProps {
  farms: string[];
  initialBirds: Record<string, number>;
  feedSchedules: FeedScheduleEntry[];
  formulasConfig: FormulasConfig;
  notes: string;
  onAddFarm: (name: string) => void;
  onDeleteFarm: (name: string) => void;
  onUpdateInitialBirds: (farm: string, count: number) => void;
  onAddFeedSchedule: (schedule: Omit<FeedScheduleEntry, 'id'>) => void;
  onDeleteFeedSchedule: (id: string) => void;
  onUpdateFeedSchedule: (id: string, updated: Partial<FeedScheduleEntry>) => void;
  onUpdateFormulasConfig: (config: Partial<FormulasConfig>) => void;
  onUpdateNotes: (notes: string) => void;
  onResetToDefaults: () => void;
  onResetAllAppData: () => void;
}

export const ConstantsView: React.FC<ConstantsViewProps> = ({
  farms,
  initialBirds,
  feedSchedules,
  formulasConfig,
  notes,
  onAddFarm,
  onDeleteFarm,
  onUpdateInitialBirds,
  onAddFeedSchedule,
  onDeleteFeedSchedule,
  onUpdateFeedSchedule,
  onUpdateFormulasConfig,
  onUpdateNotes,
  onResetAllAppData,
}) => {
  const [newFarmName, setNewFarmName] = useState('');
  const [newScheduleFarm, setNewScheduleFarm] = useState('');
  const [newScheduleDate, setNewScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [newScheduleRate, setNewScheduleRate] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Farm deletion confirmation modal state
  const [farmToDelete, setFarmToDelete] = useState<string | null>(null);

  // Hard Reset Math Challenge Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [mathNum1, setMathNum1] = useState(0);
  const [mathNum2, setMathNum2] = useState(0);
  const [mathAnswer, setMathAnswer] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const initMathChallenge = () => {
    // Generate two 3-digit numbers to require deliberate calculation
    const n1 = Math.floor(Math.random() * 800) + 125;
    const n2 = Math.floor(Math.random() * 800) + 143;
    setMathNum1(n1);
    setMathNum2(n2);
    setMathAnswer('');
    setResetError(null);
    setShowResetModal(true);
  };

  const handleExecuteReset = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = mathNum1 + mathNum2;
    const userVal = parseInt(mathAnswer.trim(), 10);

    if (isNaN(userVal) || userVal !== expected) {
      setResetError(`الناتج غير صحيح! ناتج الجمع المطلوب هو ${expected}`);
      return;
    }

    setShowResetModal(false);
    onResetAllAppData();
  };

  const handleAddFarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFarmName.trim() && !farms.includes(newFarmName.trim())) {
      onAddFarm(newFarmName.trim());
      setNewFarmName('');
    }
  };

  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetFarm = newScheduleFarm || farms[0] || 'عام';
    const rateVal = parseFloat(newScheduleRate) || 0;

    if (targetFarm && newScheduleDate && rateVal > 0) {
      onAddFeedSchedule({
        farm: targetFarm,
        startDate: newScheduleDate,
        dailyRate: rateVal,
      });
      setNewScheduleRate('');
    }
  };

  return (
    <div className="space-y-6 font-['Cairo']">
      
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#0D2149] flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <span>ثوابت وإعدادات المزارع ومعدلات الأعلاف</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة أسماء المزارع، أعداد الطيور، جداول الاستهلاك اليومي للأعلاف، والنسب القياسية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettingsModal(!showSettingsModal)}
            className="flex items-center gap-1.5 bg-[#0D2149] hover:bg-[#0B192C] text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>تعديل نسب المعادلات وطريقة العلف</span>
          </button>

          <button
            onClick={initMathChallenge}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>تصفير وحذف جميع البيانات</span>
          </button>
        </div>
      </div>

      {/* Equations & Formula Settings Panel */}
      {showSettingsModal && (
        <div className="bg-gradient-to-br from-slate-900 via-[#0D2149] to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-amber-400/30 animate-in fade-in space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-amber-400">إعداد نسب المعادلات وطريقة احتساب العلف</h3>
            </div>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ✕ إغلاق
            </button>
          </div>

          {/* Feed Calculation Mode Selection (طريقة احتساب العلف) */}
          <div className="bg-white/10 p-4 rounded-xl border border-white/15">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-amber-300">طريقة احتساب أيام استهلاك العلف اليومي:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  !formulasConfig.includeEndDateInFeedCalc
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-inner'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="feedCalcMethod"
                  checked={!formulasConfig.includeEndDateInFeedCalc}
                  onChange={() => onUpdateFormulasConfig({ includeEndDateInFeedCalc: false })}
                  className="mt-1 accent-amber-400 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>1. عدم احتساب اليوم المختار بالتاريخ (الوضع الافتراضي)</span>
                    {!formulasConfig.includeEndDateInFeedCalc && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    يحسب عدد الأيام المنقضية فقط حتى منتصف الليل السابق لليوم المختار (مثال: من 1 إلى 5 = 4 أيام).
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  formulasConfig.includeEndDateInFeedCalc
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-inner'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="feedCalcMethod"
                  checked={!!formulasConfig.includeEndDateInFeedCalc}
                  onChange={() => onUpdateFormulasConfig({ includeEndDateInFeedCalc: true })}
                  className="mt-1 accent-amber-400 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>2. يتم احتساب اليوم المختار بالتاريخ كاملاً (+1 يوم)</span>
                    {formulasConfig.includeEndDateInFeedCalc && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    يحسب اليوم الحالي أو تاريخ النهاية أيضاً كأحد أيام الاستهلاك الكاملة (مثال: من 1 إلى 5 = 5 أيام).
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <label className="block text-slate-300 font-bold mb-1.5">
                نسبة السوبر للعلف (Super Ratio)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">1 كيس سوبر لكل :</span>
                <input
                  type="number"
                  value={formulasConfig.superFeedRatio}
                  onChange={(e) =>
                    onUpdateFormulasConfig({ superFeedRatio: parseFloat(e.target.value) || 20 })
                  }
                  className="w-20 bg-white/10 text-amber-300 font-bold text-center rounded-lg px-2 py-1 border border-white/20"
                />
                <span className="text-slate-400 text-xs">كيس علف</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                المعادلة: Super = وارد super - (علف وارد / {formulasConfig.superFeedRatio})
              </p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <label className="block text-slate-300 font-bold mb-1.5">
                عدد الكراتين في صندوق البيض
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">1 صندوق =</span>
                <input
                  type="number"
                  value={formulasConfig.eggBoxCartonCount}
                  onChange={(e) =>
                    onUpdateFormulasConfig({ eggBoxCartonCount: parseFloat(e.target.value) || 12 })
                  }
                  className="w-20 bg-white/10 text-blue-300 font-bold text-center rounded-lg px-2 py-1 border border-white/20"
                />
                <span className="text-slate-400 text-xs">كرتونة (360 بيضة)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                يستخدم لتحويل الصناديق إلى كراتين والعكس تلقائياً
              </p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <label className="block text-slate-300 font-bold mb-1.5">
                عدد الأكياس في طن العلف
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">1 طن =</span>
                <input
                  type="number"
                  value={formulasConfig.feedTonBagsCount}
                  onChange={(e) =>
                    onUpdateFormulasConfig({ feedTonBagsCount: parseFloat(e.target.value) || 20 })
                  }
                  className="w-20 bg-white/10 text-emerald-300 font-bold text-center rounded-lg px-2 py-1 border border-white/20"
                />
                <span className="text-slate-400 text-xs">كيس (50 كغ)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                يستخدم لتحويل الأطنان إلى أكياس في الإحصائيات
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Right Section: Farms Management (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Add New Farm Card */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>إضافة مزرعة جديدة</span>
            </h3>
            <form onSubmit={handleAddFarmSubmit} className="flex gap-2">
              <input
                type="text"
                value={newFarmName}
                onChange={(e) => setNewFarmName(e.target.value)}
                placeholder="اسم المزرعة الجديدة..."
                className="flex-1 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D2149]"
              />
              <button
                type="submit"
                disabled={!newFarmName.trim()}
                className="bg-[#0D2149] hover:bg-[#0B192C] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>إضافة</span>
              </button>
            </form>
          </div>

          {/* Farms List (قائمة المزارع) */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>قائمة المزارع</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {farms.length} مزارع مسجلة
              </span>
            </div>

            {farms.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                لا توجد مزارع مسجلة حالياً، أضف مزرعتك الأولى أعلاه
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
                {farms.map((farm) => {
                  const birdCount = initialBirds[farm] ?? 0;
                  return (
                    <div
                      key={farm}
                      className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-2 h-2 rounded-full bg-[#0D2149]"></div>
                        <span className="text-xs font-bold text-slate-800">{farm}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold">العدد:</span>
                          <input
                            type="number"
                            value={birdCount === 0 ? '' : birdCount}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                              onUpdateInitialBirds(farm, isNaN(val) ? 0 : val);
                            }}
                            className="w-20 bg-white text-slate-900 font-mono font-bold text-center text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D2149]"
                          />
                          <span className="text-[10px] text-slate-400">طير</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setFarmToDelete(farm)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={`حذف ${farm}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Left Section: Daily Feed Schedule (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Wheat className="w-4.5 h-4.5 text-amber-600" />
                  <span>جدول استهلاك الأعلاف اليومي (كيس / يوم)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يتم احتساب الاستهلاك التلقائي بضرب المعدل اليومي في عدد الأيام ({formulasConfig.includeEndDateInFeedCalc ? 'شاملاً اليوم المختار' : 'حتى اليوم السابق'})
                </p>
              </div>
            </div>

            {/* Add Feed Schedule Entry Form */}
            <form
              onSubmit={handleAddScheduleSubmit}
              className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  المزرعة
                </label>
                <select
                  value={newScheduleFarm}
                  onChange={(e) => setNewScheduleFarm(e.target.value)}
                  className="w-full bg-white text-xs font-bold rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none"
                >
                  <option value="" disabled className="text-slate-400">
                    إختيار...
                  </option>
                  {farms.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  تاريخ البدء
                </label>
                <input
                  type="date"
                  value={newScheduleDate}
                  onChange={(e) => setNewScheduleDate(e.target.value)}
                  className="w-full bg-white text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  المعدل (كيس/يوم)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newScheduleRate}
                  onChange={(e) => setNewScheduleRate(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none text-center"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!parseFloat(newScheduleRate)}
                  className="w-full bg-[#0D2149] hover:bg-[#0B192C] disabled:opacity-50 text-amber-400 font-bold text-xs py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة جدول</span>
                </button>
              </div>
            </form>

            {/* Schedules Table with Live Editable Rates */}
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 shadow-2xs z-10">
                  <tr>
                    <th className="py-2.5 px-3">المزرعة</th>
                    <th className="py-2.5 px-3">تاريخ البدء</th>
                    <th className="py-2.5 px-3 text-center min-w-[150px]">المعدل اليومي (كيس/يوم)</th>
                    <th className="py-2.5 px-2 text-center w-12">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {feedSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                        لا توجد جداول أعلاف مسجلة حالياً
                      </td>
                    </tr>
                  ) : (
                    feedSchedules.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <select
                            value={entry.farm}
                            onChange={(e) =>
                              onUpdateFeedSchedule(entry.id, { farm: e.target.value })
                            }
                            className="bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:border-[#0D2149] focus:outline-none shadow-2xs transition-all"
                          >
                            {farms.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="date"
                            value={entry.startDate}
                            onChange={(e) =>
                              onUpdateFeedSchedule(entry.id, { startDate: e.target.value })
                            }
                            className="bg-white hover:bg-slate-50 focus:bg-white text-slate-800 font-mono font-bold text-xs rounded-lg px-2 py-1 border border-slate-300 focus:border-[#0D2149] focus:outline-none transition-all shadow-2xs"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {/* Live editable Daily Rate field */}
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              step="any"
                              value={entry.dailyRate === 0 ? '' : entry.dailyRate}
                              placeholder="0"
                              onChange={(e) => {
                                const raw = e.target.value;
                                const val = raw === '' ? 0 : parseFloat(raw);
                                onUpdateFeedSchedule(entry.id, {
                                  dailyRate: isNaN(val) ? 0 : val,
                                });
                              }}
                              className="w-24 bg-amber-50/80 hover:bg-white focus:bg-white text-amber-950 font-mono font-black text-center text-xs sm:text-sm rounded-lg border border-amber-300 focus:border-[#0D2149] focus:ring-2 focus:ring-[#0D2149]/20 px-2 py-1 focus:outline-none shadow-2xs transition-all"
                            />
                            <span className="text-[11px] text-amber-800 font-bold">كيس/يوم</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => onDeleteFeedSchedule(entry.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف هذا الجدول"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reference Notepad */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <span>ملاحظات ومعايير النظام المرجعية</span>
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                مرجع عام
              </span>
            </div>

            {/* Pinned Reference Standards */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 mb-3 text-xs text-amber-950 font-semibold space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-600 font-black">•</span>
                <span>1 طن علف = 20 كيس (50 كغ للكيس)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-600 font-black">•</span>
                <span>مخزون super: (مجموع أكياس super الواردة - مجموع أكياس العلف / 20)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-600 font-black">•</span>
                <span>بيض المائدة: (1 صندوق = 12 كرتونة = 360 بيضة)</span>
              </div>
            </div>

            {/* Free Text Notepad */}
            <textarea
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              rows={4}
              placeholder="اكتب ملاحظاتك الإضافية هنا..."
              className="w-full bg-slate-50 text-slate-800 text-xs rounded-xl p-3 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D2149] transition-all"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Farm Delete In-App Confirmation Modal */}
      {/* ------------------------------------------------------------- */}
      {farmToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4 font-['Cairo']"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">تأكيد حذف المزرعة</h3>
                <p className="text-xs text-slate-500 mt-0.5">يرجى التأكيد للمتابعة</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف المزرعة <span className="font-black text-[#0D2149]">"{farmToDelete}"</span> من قائمة المزارع؟
              <p className="text-[11px] text-slate-500 mt-2">
                (ملاحظة: يمكنك التراجع عن الحذف في أي وقت عبر زر التراجع أو الضغط على Ctrl+Z).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFarmToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteFarm(farmToDelete);
                  setFarmToDelete(null);
                }}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف المزرعة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Complete Data Reset Math Security Challenge Modal */}
      {/* ------------------------------------------------------------- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 text-right space-y-4 font-['Cairo']"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-7 h-7 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-700">تحذير أمني: تصفير وحذف جميع بيانات البرنامج نهائياً</h3>
                <p className="text-xs text-slate-500 mt-0.5">عملية تصفير شاملة للنظام</p>
              </div>
            </div>

            {/* Warning Note */}
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-900 leading-relaxed font-semibold">
              <p className="font-black text-sm mb-1.5 text-rose-700">⚠️ تنبيه هام وشديد الخطورة:</p>
              سيؤدي هذا الإجراء إلى مسح وتصفير كافة الحركات اليومية، المزارع المسجلة، جداول الأعلاف، والملاحظات بالكامل والبدء بنظام فارغ 100%.
            </div>

            {/* Logical Security Challenge Form */}
            <form onSubmit={handleExecuteReset} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#0D2149]" />
                  <span>سؤال أمان منطقي للتأكيد (احسب ناتج الجمع التالي):</span>
                </label>
                <div className="flex items-center justify-center gap-3 bg-white p-3 rounded-xl border border-slate-300 font-mono text-lg font-black text-[#0D2149] select-none">
                  <span>{mathNum1}</span>
                  <span className="text-amber-500 font-sans">+</span>
                  <span>{mathNum2}</span>
                  <span className="text-slate-400 font-sans">=</span>
                  <span className="text-rose-600">؟</span>
                </div>

                <div>
                  <input
                    type="number"
                    required
                    value={mathAnswer}
                    onChange={(e) => {
                      setMathAnswer(e.target.value);
                      setResetError(null);
                    }}
                    placeholder="اكتب ناتج الجمع هنا للتأكيد..."
                    className="w-full bg-white text-slate-900 font-mono font-bold text-center text-sm rounded-xl px-3 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  {resetError && (
                    <p className="text-xs font-bold text-rose-600 mt-1.5 text-center animate-shake">
                      {resetError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="submit"
                  disabled={!mathAnswer.trim()}
                  className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تأكيد تصفير النظام نهائياً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
