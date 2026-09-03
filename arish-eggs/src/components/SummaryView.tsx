import React, { useMemo } from 'react';
import { Transaction, FeedScheduleEntry, FormulasConfig } from '../types';
import { calculateAllSummaries, formatWesternNumber } from '../utils/calculations';
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wheat,
  Egg,
} from 'lucide-react';

interface SummaryViewProps {
  transactions: Transaction[];
  farms: string[];
  initialBirds: Record<string, number>;
  feedSchedules: FeedScheduleEntry[];
  formulasConfig: FormulasConfig;
  searchQuery: string;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  transactions,
  farms,
  initialBirds,
  feedSchedules,
  formulasConfig,
  searchQuery,
}) => {
  const summaryRows = useMemo(() => {
    const all = calculateAllSummaries(
      transactions,
      farms,
      initialBirds,
      feedSchedules,
      formulasConfig
    );
    if (!searchQuery) return all;
    return all.filter((r) =>
      r.farm.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, farms, initialBirds, feedSchedules, formulasConfig, searchQuery]);

  // Overall key metrics for top summary cards
  const totalRow = useMemo(() => {
    return summaryRows.find((r) => r.isTotalRow);
  }, [summaryRows]);

  const generalRow = useMemo(() => {
    return summaryRows.find((r) => r.isGeneralRow);
  }, [summaryRows]);

  const eggBoxRatio = formulasConfig.eggBoxCartonCount || 12;
  const feedTonRatio = formulasConfig.feedTonBagsCount || 20;

  return (
    <div className="space-y-4 font-['Cairo']">
      
      {/* ------------------------------------------------------------- */}
      {/* Top Highlights Cards (ترتيب دقيق: صافي الأرباح، رصيد العلف، مخزون السوبر، رصيد البيض) */}
      {/* ------------------------------------------------------------- */}
      {totalRow && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Net Profit (صافي الأرباح) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>صافي الأرباح الإجمالية</span>
              {totalRow.profit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div
              className={`text-xl sm:text-2xl font-black font-mono ${
                totalRow.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatWesternNumber(totalRow.profit, 2)} $
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between font-mono">
              <span>إيراد: {formatWesternNumber(totalRow.income, 2)} $</span>
              <span>مصروف: {formatWesternNumber(totalRow.expenses, 2)} $</span>
            </div>
          </div>

          {/* Card 2: Feed Remaining (رصيد العلف المتبقي) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>رصيد العلف المتبقي</span>
              <Wheat className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-900">
              {formatWesternNumber(totalRow.feedRemaining, 1)}{' '}
              <span className="text-xs font-bold font-sans text-amber-600">كيس</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              يعادل {(totalRow.feedRemaining / feedTonRatio).toFixed(1)} طن ({feedTonRatio} كيس/طن)
            </div>
          </div>

          {/* Card 3: Super Stock (مخزون السوبر المتاح) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>مخزون السوبر المتاح (Super)</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div
              className={`text-xl sm:text-2xl font-black font-mono ${
                (generalRow?.superStock ?? 0) >= 0 ? 'text-purple-900' : 'text-rose-600'
              }`}
            >
              {formatWesternNumber(generalRow?.superStock ?? 0, 2)}{' '}
              <span className="text-xs font-bold font-sans text-purple-600">كيس</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              (سوبر وارد - علف / {formulasConfig.superFeedRatio || 20})
            </div>
          </div>

          {/* Card 4: Egg Balance (رصيد البيض بالمزارع) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>رصيد البيض بالمزارع</span>
              <Egg className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-blue-900">
              {formatWesternNumber(totalRow.eggBalance)}{' '}
              <span className="text-xs font-bold font-sans text-blue-600">كرتونة</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              يعادل {(totalRow.eggBalance / eggBoxRatio).toFixed(1)} صندوق ({eggBoxRatio} كرتونة/صندوق)
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Main Summary Table (تقرير حركة المزارع) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs sm:text-sm font-black text-[#0D2149]">
              تقرير حركة المزارع
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table className="w-full text-right border-collapse select-none min-w-[950px]">
            {/* Table Header */}
            <thead className="sticky top-0 z-10 bg-[#0D2149] text-white text-xs font-bold shadow-xs">
              <tr className="border-b border-[#0B192C]">
                <th className="py-3 px-4 w-44">المزرعة / البيان</th>
                <th className="py-3 px-4 w-32 text-center text-rose-300">المصروفات ($)</th>
                <th className="py-3 px-4 w-32 text-center text-emerald-300">الإيرادات ($)</th>
                <th className="py-3 px-4 w-32 text-center text-amber-300 bg-amber-950/20">الأرباح ($)</th>
                <th className="py-3 px-4 w-36 text-center text-amber-200">رصيد العلف (كيس)</th>
                <th className="py-3 px-4 w-36 text-center text-blue-300">رصيد البيض (كرتونة)</th>
                <th className="py-3 px-4 w-36 text-center text-slate-200">الطيور الحالية (طير)</th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-200 text-xs">
              {summaryRows.map((row) => {
                // 1. General Row (حسابات عامة ومخزون السوبر) - Labeled "عام"
                if (row.isGeneralRow) {
                  return (
                    <tr
                      key="general-row"
                      className="bg-purple-50/90 hover:bg-purple-100/70 font-bold transition-colors border-t-2 border-purple-200"
                    >
                      <td className="py-3 px-4 flex items-center gap-2 text-purple-950 font-black">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                        <span>عام</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-rose-700 font-bold">
                        {row.expenses > 0 ? `${formatWesternNumber(row.expenses, 2)} $` : '0 $'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-700 font-bold">
                        {row.income > 0 ? `${formatWesternNumber(row.income, 2)} $` : '0 $'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-purple-950 bg-purple-100/60">
                        {formatWesternNumber(row.profit, 2)} $
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">-</td>
                      <td className="py-3 px-4 text-center text-slate-400">-</td>
                      {/* Super Stock displayed in General Row */}
                      <td className="py-3 px-4 text-center bg-purple-100 text-purple-950 font-mono font-black border-r border-purple-200">
                        <span className="text-[10px] text-purple-700 block font-normal">مخزون Super المتبقي:</span>
                        <span>{formatWesternNumber(row.superStock, 2)} كيس</span>
                      </td>
                    </tr>
                  );
                }

                // 2. Total Row (المجموع الإجمالي)
                if (row.isTotalRow) {
                  return (
                    <tr
                      key="total-row"
                      className="bg-amber-100/90 hover:bg-amber-200 font-black text-xs text-slate-900 border-t-2 border-amber-400 border-b-2"
                    >
                      <td className="py-3.5 px-4 font-black text-sm text-[#0D2149] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>المجموع الإجمالي</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-rose-800 text-sm">
                        {formatWesternNumber(row.expenses, 2)} $
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-800 text-sm">
                        {formatWesternNumber(row.income, 2)} $
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-950 text-sm bg-amber-200/80">
                        {formatWesternNumber(row.profit, 2)} $
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-950">
                        <span className="font-bold block">{formatWesternNumber(row.feedRemaining, 1)} كيس</span>
                        <span className="text-[10px] text-amber-800 block font-normal">
                          ({(row.feedRemaining / feedTonRatio).toFixed(1)} طن)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-blue-900">
                        <span className="font-bold block">{formatWesternNumber(row.eggBalance)} كرتونة</span>
                        <span className="text-[10px] text-blue-700 block font-normal">
                          ({(row.eggBalance / eggBoxRatio).toFixed(1)} صندوق)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-950">
                        <span className="font-bold block">{formatWesternNumber(row.currentBirds)} طير</span>
                        <span className="text-[10px] text-rose-600 block font-normal">
                          (إجمالي النفوق: {formatWesternNumber(row.deaths)})
                        </span>
                      </td>
                    </tr>
                  );
                }

                // 3. Regular Farm Row
                return (
                  <tr
                    key={row.farm}
                    className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <span>{row.farm}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-rose-700 font-semibold">
                      {row.expenses > 0 ? `${formatWesternNumber(row.expenses, 2)} $` : '0 $'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-700 font-semibold">
                      {row.income > 0 ? `${formatWesternNumber(row.income, 2)} $` : '0 $'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                      {formatWesternNumber(row.profit, 2)} $
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-900">
                      <span className="font-bold">{formatWesternNumber(row.feedRemaining, 1)}</span>
                      <span className="text-[10px] text-slate-400 block">
                        ({(row.feedRemaining / feedTonRatio).toFixed(1)} ط)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-blue-900">
                      <span className="font-bold">{formatWesternNumber(row.eggBalance)}</span>
                      <span className="text-[10px] text-slate-400 block">
                        ({(row.eggBalance / eggBoxRatio).toFixed(1)} ص)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-800">
                      <span className="font-bold">{formatWesternNumber(row.currentBirds)}</span>
                      {row.deaths > 0 && (
                        <span className="text-[10px] text-rose-500 block">
                          (نفوق: {formatWesternNumber(row.deaths)})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
