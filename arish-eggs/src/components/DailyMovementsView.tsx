import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, FormulasConfig } from '../types';
import {
  calculateRowExpenses,
  calculateRowIncome,
  formatWesternNumber,
  getAvailableUnitsForCategory,
  getDefaultUnitForCategory,
  getAvailablePriceUnitsForCategory,
  getDefaultPriceUnitForCategory,
  isEggProductionCategory,
  isEggLoadedCategory,
  isFeedCategory,
  isSuperCategory,
  isDeathCategory,
} from '../utils/calculations';
import {
  Plus,
  Trash2,
  Table as TableIcon,
  Sparkles,
  Layers,
  Edit3,
  MoreVertical,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react';

interface DailyMovementsViewProps {
  transactions: Transaction[];
  farms: string[];
  formulasConfig: FormulasConfig;
  searchQuery: string;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onInsertTransaction?: (targetId: string, position: 'above' | 'below', transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (id: string, updated: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
}

// Preset standard categories
const PRESET_CATEGORIES = [
  'بيض انتاج',
  'بيض تحميل',
  'علف',
  'super',
  'مدخول',
  'وفيات',
];

export const DailyMovementsView: React.FC<DailyMovementsViewProps> = ({
  transactions,
  farms,
  formulasConfig,
  searchQuery,
  onAddTransaction,
  onInsertTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  // Selected cell / row tracking
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedCellName, setSelectedCellName] = useState<string>('A1');

  // Active dropdown menu for row actions
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  // Active composite helper popup for inline rows
  const [activeCompositeRowId, setActiveCompositeRowId] = useState<string | null>(null);

  // Active custom category in-place editing state
  const [customEditingRowId, setCustomEditingRowId] = useState<string | null>(null);

  // Close row actions dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuRowId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Farm options list (including 'عام' for general expenses/super)
  const farmOptions = useMemo(() => {
    const list = [...farms];
    if (!list.includes('عام')) {
      list.push('عام');
    }
    return list;
  }, [farms]);

  // Filtered transactions (Excel-like continuous long list, newest on top)
  const processedTransactions = useMemo(() => {
    let list = [...transactions];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.farm?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.date?.includes(q)
      );
    }
    return list;
  }, [transactions, searchQuery]);

  // Create default new row template
  const createNewRowData = (referenceTransaction?: Transaction): Omit<Transaction, 'id'> => {
    const today = referenceTransaction ? referenceTransaction.date : new Date().toISOString().split('T')[0];
    const defaultFarm = referenceTransaction ? referenceTransaction.farm : (farms.length > 0 ? farms[0] : 'عام');
    const defaultCat = 'بيض انتاج';
    const defaultU = getDefaultUnitForCategory(defaultCat);
    const defaultPU = getDefaultPriceUnitForCategory(defaultCat, defaultU);

    return {
      date: today,
      farm: defaultFarm,
      category: defaultCat,
      qty: 0,
      unit: defaultU,
      price: 0,
      priceUnit: defaultPU,
      notes: '',
    };
  };

  // Add new empty row directly to top
  const handleAddNewRowDirectly = () => {
    onAddTransaction(createNewRowData());
  };

  // Insert row relative to target
  const handleInsertRow = (targetTransaction: Transaction, position: 'above' | 'below') => {
    const newRow = createNewRowData(targetTransaction);
    if (onInsertTransaction) {
      onInsertTransaction(targetTransaction.id, position, newRow);
    } else {
      onAddTransaction(newRow);
    }
    setOpenMenuRowId(null);
  };

  // Convert Egg dual inputs
  const handleEggDualCalc = (rowId: string, boxes: number, cartons: number) => {
    const ratio = formulasConfig.eggBoxCartonCount || 12;
    const totalCartons = boxes * ratio + cartons;
    onUpdateTransaction(rowId, {
      boxQty: boxes,
      cartonQty: cartons,
      qty: totalCartons,
      unit: 'كرتونة',
    });
  };

  // Convert Feed dual inputs
  const handleFeedDualCalc = (rowId: string, tons: number, bags: number) => {
    const ratio = formulasConfig.feedTonBagsCount || 20;
    const totalBags = tons * ratio + bags;
    onUpdateTransaction(rowId, {
      tonQty: tons,
      bagQty: bags,
      qty: totalBags,
      unit: 'كيس',
    });
  };

  return (
    <div className="space-y-3 font-['Cairo']">
      
      {/* ------------------------------------------------------------- */}
      {/* Continuous Excel-Like Table (الإدخال والتعديل المباشر داخل الجدول) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-300 overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddNewRowDirectly}
              className="bg-[#0D2149] hover:bg-[#071228] text-amber-300 font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>إضافة سطر جديد للجدول</span>
            </button>

            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs sm:text-sm font-black text-[#0D2149]">
                جدول الحركات اليومية
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="bg-slate-200/80 px-2.5 py-0.5 rounded-lg text-slate-800 font-mono">
              إجمالي الحركات: {formatWesternNumber(processedTransactions.length)}
            </span>
          </div>
        </div>

        {/* Scrollable Container with Comfortable Column Sizes */}
        <div className="overflow-x-auto overflow-y-auto max-h-[75vh] border-b border-slate-200">
          <table className="w-full text-right border-collapse select-none min-w-[1150px]">
            {/* Table Column Headers */}
            <thead className="sticky top-0 z-10 bg-[#0D2149] text-white text-xs font-bold shadow-xs">
              <tr className="border-b border-[#0B192C]">
                <th className="py-3 px-2 w-10 text-center text-slate-400">#</th>
                <th className="py-3 px-3 w-36">التاريخ</th>
                <th className="py-3 px-3 w-48 min-w-[180px]">المزرعة</th>
                <th className="py-3 px-3 w-48 min-w-[190px]">البند / الصنف</th>
                <th className="py-3 px-3 w-52 text-center min-w-[210px]">الكمية والوحدة</th>
                <th className="py-3 px-3 w-44 text-center min-w-[170px]">السعر والوحدة</th>
                <th className="py-3 px-3 w-32 text-center text-rose-300">المصروف ($)</th>
                <th className="py-3 px-3 w-32 text-center text-emerald-300">المدخول ($)</th>
                <th className="py-3 px-3 min-w-[170px]">ملاحظات</th>
                <th className="py-3 px-2 w-14 text-center">خيارات</th>
              </tr>
            </thead>

            {/* Table Rows Body */}
            <tbody className="divide-y divide-slate-200 text-xs font-semibold">
              {processedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <TableIcon className="w-9 h-9 text-slate-300" />
                      <span className="text-sm font-bold text-slate-600">لا توجد حركات مسجلة في الجدول</span>
                      <button
                        type="button"
                        onClick={handleAddNewRowDirectly}
                        className="bg-[#0D2149] text-amber-300 hover:bg-[#071228] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>إضافة أول سطر للجدول الآن</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedTransactions.map((t, idx) => {
                  const currentUnit = t.unit || getDefaultUnitForCategory(t.category);
                  const currentPriceUnit = t.priceUnit || getDefaultPriceUnitForCategory(t.category, currentUnit);
                  const expenses = calculateRowExpenses(t.category, t.qty, t.price, currentUnit, currentPriceUnit, formulasConfig);
                  const income = calculateRowIncome(t.category, t.qty, t.price, currentUnit, currentPriceUnit, formulasConfig);
                  
                  const isEgg = isEggProductionCategory(t.category) || isEggLoadedCategory(t.category);
                  const isFeed = isFeedCategory(t.category) || isSuperCategory(t.category);
                  const isSelected = selectedRowId === t.id;

                  // Numbering: counts from oldest at bottom (#1) to newest at top (#Total) matching Excel row numbers
                  const rowNumber = processedTransactions.length - idx;

                  // Check if current category is a standard preset or custom
                  const isCustomCategory = !PRESET_CATEGORIES.includes(t.category);

                  return (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setSelectedRowId(t.id);
                        setSelectedCellName(`Row ${rowNumber}`);
                      }}
                      className={`transition-colors group border-b border-slate-100 cursor-pointer ${
                        isSelected ? 'bg-amber-50/70 ring-1 ring-amber-400/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* # Index: Matching Excel Row Numbers (Oldest at bottom = 1, Newest at top = N) */}
                      <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px] font-bold">
                        {rowNumber}
                      </td>

                      {/* Date */}
                      <td className="py-2 px-2.5">
                        <input
                          type="date"
                          value={t.date}
                          onFocus={() => {
                            setSelectedRowId(t.id);
                            setSelectedCellName(`A${rowNumber}`);
                          }}
                          onChange={(e) => onUpdateTransaction(t.id, { date: e.target.value })}
                          className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-800 font-mono font-bold text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:border-[#0D2149] focus:outline-none transition-all shadow-2xs"
                        />
                      </td>

                      {/* Farm Selector - واسعة ومريحة */}
                      <td className="py-2 px-2.5">
                        <select
                          value={t.farm || 'عام'}
                          onFocus={() => {
                            setSelectedRowId(t.id);
                            setSelectedCellName(`B${rowNumber}`);
                          }}
                          onChange={(e) => onUpdateTransaction(t.id, { farm: e.target.value })}
                          className="w-full min-w-[160px] bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold text-xs sm:text-sm rounded-lg px-3 py-1.5 border border-slate-300 focus:border-[#0D2149] focus:outline-none transition-all shadow-2xs"
                        >
                          {farmOptions.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Category / Item - تعديل مباشر بنفس الخانة بسلاسة وبدون تعقيد */}
                      <td className="py-2 px-2.5">
                        {customEditingRowId === t.id ? (
                          /* Direct in-place text editor if user clicked to edit custom text */
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              value={t.category}
                              onFocus={() => {
                                setSelectedRowId(t.id);
                                setSelectedCellName(`C${rowNumber}`);
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newU = getDefaultUnitForCategory(val);
                                onUpdateTransaction(t.id, {
                                  category: val,
                                  unit: newU,
                                  priceUnit: getDefaultPriceUnitForCategory(val, newU),
                                });
                              }}
                              onBlur={() => setCustomEditingRowId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setCustomEditingRowId(null);
                                }
                              }}
                              placeholder="اكتب اسم الصنف هنا..."
                              className="w-full bg-amber-50 text-amber-950 font-bold text-xs rounded-lg px-2.5 py-1.5 border-2 border-amber-400 focus:outline-none shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomEditingRowId(null)}
                              className="px-2 py-1 bg-amber-200 text-amber-900 rounded font-bold text-[10px] hover:bg-amber-300"
                            >
                              تم
                            </button>
                          </div>
                        ) : (
                          /* Combined Dropdown with editable custom item in the same select */
                          <div className="flex items-center gap-1">
                            <select
                              value={isCustomCategory ? '__CUSTOM__' : t.category}
                              onFocus={() => {
                                setSelectedRowId(t.id);
                                setSelectedCellName(`C${rowNumber}`);
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__CUSTOM__') {
                                  setCustomEditingRowId(t.id);
                                } else {
                                  const newU = getDefaultUnitForCategory(val);
                                  const newPU = getDefaultPriceUnitForCategory(val, newU);
                                  onUpdateTransaction(t.id, {
                                    category: val,
                                    unit: newU,
                                    priceUnit: newPU,
                                  });
                                }
                              }}
                              className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:border-[#0D2149] focus:outline-none transition-all shadow-2xs"
                            >
                              <option value="بيض انتاج">بيض انتاج</option>
                              <option value="بيض تحميل">بيض تحميل</option>
                              <option value="علف">علف</option>
                              <option value="super">super (سوبر)</option>
                              <option value="مدخول">مدخول (إيراد)</option>
                              <option value="وفيات">وفيات (نفوق)</option>
                              
                              {/* If custom, show the exact custom text inside the dropdown itself */}
                              {isCustomCategory ? (
                                <option value="__CUSTOM__">
                                  {t.category ? `مخصص: ${t.category}` : 'أخرى (اكتب مخصص...)'}
                                </option>
                              ) : (
                                <option value="__CUSTOM__">أخرى (مخصص...)</option>
                              )}
                            </select>

                            {/* If custom category, show quick pencil icon to edit in-place without popup */}
                            {isCustomCategory && (
                              <button
                                type="button"
                                onClick={() => setCustomEditingRowId(t.id)}
                                className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-md transition-colors"
                                title="تعديل اسم الصنف المخصص"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Quantity & Unit with dual composite capability in table */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 relative">
                          
                          {/* Case A: Egg with dual box+carton capability */}
                          {isEgg ? (
                            <div className="flex items-center gap-1 bg-blue-50/80 px-1.5 py-1 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-0.5">
                                <input
                                  type="number"
                                  step="any"
                                  value={t.boxQty !== undefined && t.boxQty !== null ? (t.boxQty === 0 ? '' : t.boxQty) : ''}
                                  placeholder="0"
                                  onFocus={() => {
                                    setSelectedRowId(t.id);
                                    setSelectedCellName(`D${rowNumber} (صندوق)`);
                                  }}
                                  onChange={(e) => {
                                    const b = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                    const c = t.cartonQty || 0;
                                    handleEggDualCalc(t.id, b, c);
                                  }}
                                  className="w-12 bg-white text-blue-900 font-mono font-bold text-xs rounded px-1 py-0.5 border border-blue-300 text-center"
                                />
                                <span className="text-[10px] font-bold text-blue-800 shrink-0">ص</span>
                              </div>

                              <span className="text-blue-400 font-bold text-[10px]">+</span>

                              <div className="flex items-center gap-0.5">
                                <input
                                  type="number"
                                  step="any"
                                  value={t.cartonQty !== undefined && t.cartonQty !== null ? (t.cartonQty === 0 ? '' : t.cartonQty) : (t.boxQty ? '' : (t.qty === 0 ? '' : t.qty))}
                                  placeholder="0"
                                  onFocus={() => {
                                    setSelectedRowId(t.id);
                                    setSelectedCellName(`D${rowNumber} (كرتونة)`);
                                  }}
                                  onChange={(e) => {
                                    const c = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                    const b = t.boxQty || 0;
                                    handleEggDualCalc(t.id, b, c);
                                  }}
                                  className="w-12 bg-white text-blue-900 font-mono font-bold text-xs rounded px-1 py-0.5 border border-blue-300 text-center"
                                />
                                <span className="text-[10px] font-bold text-blue-800 shrink-0">ك</span>
                              </div>

                              {/* Total Cartons Badge */}
                              <span
                                className="text-[10px] font-mono font-extrabold bg-blue-600 text-white px-1.5 py-0.5 rounded shrink-0 shadow-2xs"
                                title={`المجموع: ${t.qty} كرتونة (${(t.qty / (formulasConfig.eggBoxCartonCount || 12)).toFixed(2)} صندوق)`}
                              >
                                {t.qty}
                              </span>
                            </div>
                          ) : isFeed ? (
                            /* Case B: Feed/Super with dual ton+bag capability */
                            <div className="flex items-center gap-1 bg-amber-50/80 px-1.5 py-1 rounded-lg border border-amber-200">
                              <div className="flex items-center gap-0.5">
                                <input
                                  type="number"
                                  step="any"
                                  value={t.tonQty !== undefined && t.tonQty !== null ? (t.tonQty === 0 ? '' : t.tonQty) : ''}
                                  placeholder="0"
                                  onFocus={() => {
                                    setSelectedRowId(t.id);
                                    setSelectedCellName(`D${rowNumber} (طن)`);
                                  }}
                                  onChange={(e) => {
                                    const ton = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                    const bag = t.bagQty || 0;
                                    handleFeedDualCalc(t.id, ton, bag);
                                  }}
                                  className="w-12 bg-white text-amber-900 font-mono font-bold text-xs rounded px-1 py-0.5 border border-amber-300 text-center"
                                />
                                <span className="text-[10px] font-bold text-amber-800 shrink-0">طن</span>
                              </div>

                              <span className="text-amber-400 font-bold text-[10px]">+</span>

                              <div className="flex items-center gap-0.5">
                                <input
                                  type="number"
                                  step="any"
                                  value={t.bagQty !== undefined && t.bagQty !== null ? (t.bagQty === 0 ? '' : t.bagQty) : (t.tonQty ? '' : (t.qty === 0 ? '' : t.qty))}
                                  placeholder="0"
                                  onFocus={() => {
                                    setSelectedRowId(t.id);
                                    setSelectedCellName(`D${rowNumber} (كيس)`);
                                  }}
                                  onChange={(e) => {
                                    const bag = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                    const ton = t.tonQty || 0;
                                    handleFeedDualCalc(t.id, ton, bag);
                                  }}
                                  className="w-12 bg-white text-amber-900 font-mono font-bold text-xs rounded px-1 py-0.5 border border-amber-300 text-center"
                                />
                                <span className="text-[10px] font-bold text-amber-800 shrink-0">كيس</span>
                              </div>

                              {/* Total Bags Badge */}
                              <span
                                className="text-[10px] font-mono font-extrabold bg-amber-600 text-white px-1.5 py-0.5 rounded shrink-0 shadow-2xs"
                                title={`المجموع: ${t.qty} كيس (${(t.qty / (formulasConfig.feedTonBagsCount || 20)).toFixed(2)} طن)`}
                              >
                                {t.qty}
                              </span>
                            </div>
                          ) : (
                            /* Case C: Standard single Quantity + Unit */
                            <div className="flex items-center gap-1 w-full">
                              <input
                                type="number"
                                step="any"
                                value={t.qty === 0 ? '' : t.qty}
                                placeholder="0"
                                onFocus={() => {
                                  setSelectedRowId(t.id);
                                  setSelectedCellName(`D${rowNumber}`);
                                }}
                                onChange={(e) =>
                                  onUpdateTransaction(t.id, {
                                    qty: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="flex-1 bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-mono font-bold text-xs sm:text-sm rounded-lg px-2 py-1.5 border border-slate-300 focus:border-[#0D2149] focus:outline-none text-center shadow-2xs"
                              />

                              {/* Unit Selector */}
                              <select
                                value={currentUnit}
                                onChange={(e) => {
                                  const newU = e.target.value;
                                  onUpdateTransaction(t.id, {
                                    unit: newU,
                                    priceUnit: getDefaultPriceUnitForCategory(t.category, newU),
                                  });
                                }}
                                className="bg-slate-100 text-slate-700 font-bold text-xs rounded-lg px-2 py-1.5 border border-slate-300 focus:outline-none"
                              >
                                {getAvailableUnitsForCategory(t.category).map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Price & Price Unit */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={t.price === 0 ? '' : t.price}
                            placeholder="0"
                            onFocus={() => {
                              setSelectedRowId(t.id);
                              setSelectedCellName(`E${rowNumber}`);
                            }}
                            onChange={(e) =>
                              onUpdateTransaction(t.id, {
                                price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-18 bg-white hover:bg-slate-50 focus:bg-white text-slate-900 font-mono font-bold text-xs sm:text-sm rounded-lg px-2 py-1.5 border border-slate-300 focus:border-[#0D2149] focus:outline-none text-center shadow-2xs"
                          />
                          <select
                            value={currentPriceUnit}
                            onChange={(e) => onUpdateTransaction(t.id, { priceUnit: e.target.value })}
                            className="bg-slate-100 text-slate-700 font-bold text-xs rounded-lg px-1.5 py-1.5 border border-slate-300 focus:outline-none"
                          >
                            {getAvailablePriceUnitsForCategory(t.category, currentUnit).map((pu) => (
                              <option key={pu} value={pu}>
                                {pu}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Calculated Expenses */}
                      <td className="py-2 px-2.5 text-center font-mono text-xs font-black text-rose-700 bg-rose-50/20">
                        {expenses > 0 ? `${formatWesternNumber(expenses, 2)} $` : '-'}
                      </td>

                      {/* Calculated Income */}
                      <td className="py-2 px-2.5 text-center font-mono text-xs font-black text-emerald-700 bg-emerald-50/20">
                        {income > 0 ? `${formatWesternNumber(income, 2)} $` : '-'}
                      </td>

                      {/* Notes */}
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={t.notes || ''}
                          onFocus={() => {
                            setSelectedRowId(t.id);
                            setSelectedCellName(`H${rowNumber}`);
                          }}
                          onChange={(e) => onUpdateTransaction(t.id, { notes: e.target.value })}
                          placeholder="ملاحظات..."
                          className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-700 text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:border-[#0D2149] focus:outline-none transition-all shadow-2xs"
                        />
                      </td>

                      {/* Row Actions Dropdown */}
                      <td className="py-2 px-2 text-center relative">
                        <div className="flex items-center justify-center">
                          {/* Dropdown Trigger */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuRowId(openMenuRowId === t.id ? null : t.id);
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                                openMenuRowId === t.id
                                  ? 'bg-[#0D2149] text-amber-400 border-[#0D2149] shadow-xs'
                                  : 'text-slate-500 hover:text-[#0D2149] hover:bg-slate-100 border-slate-200 bg-white'
                              }`}
                              title="خيارات السطر (إدراج / حذف)"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuRowId === t.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-right animate-in fade-in zoom-in-95 duration-100 font-['Cairo']"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleInsertRow(t, 'above')}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#0D2149] flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <ArrowUpToLine className="w-4 h-4 text-sky-600" />
                                  <span>إدراج سطر للأعلى</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleInsertRow(t, 'below')}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#0D2149] flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                                  <span>إدراج سطر للأسفل</span>
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteTransaction(t.id);
                                    setOpenMenuRowId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                  <span>حذف هذا السطر</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
