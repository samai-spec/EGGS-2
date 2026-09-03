import * as XLSX from 'xlsx';
import { Transaction, FeedScheduleEntry, FormulasConfig } from '../types';
import {
  calculateRowExpenses,
  calculateRowIncome,
  calculateAllSummaries,
  excelSerialToDate,
  getDefaultUnitForCategory,
  getDefaultPriceUnitForCategory,
} from './calculations';

export interface ExportExcelOptions {
  transactions: Transaction[];
  farms: string[];
  initialBirds: Record<string, number>;
  feedSchedules: FeedScheduleEntry[];
  formulasConfig: FormulasConfig;
}

/**
 * Export Native Excel Workbook (.xlsx) with 3 sheets:
 * 1. الحركات اليومية
 * 2. ملخص المزارع
 * 3. ثوابت ومعدلات التغذية
 */
export function exportToNativeExcelXLSX({
  transactions,
  farms,
  initialBirds,
  feedSchedules,
  formulasConfig,
}: ExportExcelOptions): void {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: الحركات اليومية (Daily Movements)
  // In the web app, transactions are stored with newest at index 0 (top).
  // In Excel files, rows are stored chronologically from oldest (#1 at top of sheet) to newest (#N at bottom of sheet).
  // -------------------------------------------------------------
  const dailyHeaders = [
    'التاريخ',
    'المزرعة',
    'البند / الصنف',
    'الكمية',
    'الوحدة',
    'السعر ($)',
    'وحدة السعر',
    'المصروفات ($)',
    'الإيرادات ($)',
    'ملاحظات',
  ];

  const chronologicalTransactions = [...transactions].reverse();

  const dailyData = chronologicalTransactions.map((t) => {
    const unit = t.unit || getDefaultUnitForCategory(t.category);
    const priceUnit = t.priceUnit || getDefaultPriceUnitForCategory(t.category, unit);
    const expenses = calculateRowExpenses(t.category, t.qty, t.price, unit, priceUnit, formulasConfig);
    const income = calculateRowIncome(t.category, t.qty, t.price, unit, priceUnit, formulasConfig);

    return [
      t.date || '',
      t.farm || '',
      t.category || '',
      Number(t.qty) || 0,
      unit,
      Number(t.price) || 0,
      priceUnit,
      expenses,
      income,
      t.notes || '',
    ];
  });

  const wsDaily = XLSX.utils.aoa_to_sheet([dailyHeaders, ...dailyData]);
  wsDaily['!cols'] = [
    { wch: 14 }, // التاريخ
    { wch: 20 }, // المزرعة
    { wch: 22 }, // البند
    { wch: 12 }, // الكمية
    { wch: 14 }, // الوحدة
    { wch: 14 }, // السعر
    { wch: 14 }, // وحدة السعر
    { wch: 14 }, // المصروفات
    { wch: 14 }, // الإيرادات
    { wch: 32 }, // ملاحظات
  ];

  XLSX.utils.book_append_sheet(wb, wsDaily, 'الحركات اليومية');

  // -------------------------------------------------------------
  // Sheet 2: ملخص المزارع (Farm Summaries)
  // -------------------------------------------------------------
  const summaryRows = calculateAllSummaries(
    transactions,
    farms,
    initialBirds,
    feedSchedules,
    formulasConfig
  );

  const summaryHeaders = [
    'المزرعة',
    'المصروفات ($)',
    'الإيرادات ($)',
    'الأرباح ($)',
    'إنتاج البيض (كرتونة)',
    'تحميل البيض (كرتونة)',
    'رصيد البيض (كرتونة)',
    'رصيد البيض (صندوق)',
    'العلف الوارد (كيس)',
    'العلف المستهلك (كيس)',
    'رصيد العلف (كيس)',
    'رصيد العلف (طن)',
    'العدد الأولي للطيور',
    'النفوق الإجمالي',
    'العدد الحالي للطيور',
    'رصيد مخزون Super (كيس)',
  ];

  const summaryData = summaryRows.map((r) => [
    r.farm,
    r.expenses,
    r.income,
    r.profit,
    r.eggProduction,
    r.eggLoaded,
    r.eggBalance,
    Number((r.eggBalance / (formulasConfig.eggBoxCartonCount || 12)).toFixed(1)),
    r.feedSupplied,
    r.feedConsumed,
    r.feedRemaining,
    Number((r.feedRemaining / (formulasConfig.feedTonBagsCount || 20)).toFixed(1)),
    r.initialBirds,
    r.deaths,
    r.currentBirds,
    r.isGeneralRow || r.isTotalRow ? r.superStock : '',
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryData]);
  wsSummary['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص المزارع');

  // -------------------------------------------------------------
  // Sheet 3: ثوابت ومعدلات التغذية (Constants & Schedules)
  // -------------------------------------------------------------
  const scheduleHeaders = ['المزرعة', 'تاريخ البدء', 'معدل الاستهلاك اليومي (كيس/يوم)'];
  const scheduleData = feedSchedules.map((s) => [s.farm, s.startDate, s.dailyRate]);
  const wsRates = XLSX.utils.aoa_to_sheet([scheduleHeaders, ...scheduleData]);
  wsRates['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(wb, wsRates, 'معدلات التغذية');

  // -------------------------------------------------------------
  // Write & Trigger Download
  // -------------------------------------------------------------
  const today = new Date().toISOString().split('T')[0];
  const filename = `ARISH_EGGS_Backup_${today}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Parse raw CSV or Excel Table text with comprehensive column support
 */
export function parseCSVOrTableText(
  rawText: string,
  onComplete: (data: { transactions: Transaction[]; newFarms?: string[] }) => void,
  onError: (err: string) => void
): void {
  try {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      onError('النص المنسوخ فارغ');
      return;
    }

    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = ';';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') || lines.some((l) => l.includes(';'))) delimiter = ';';
    else if (firstLine.includes(',')) delimiter = ',';

    const rows = lines.map((line) => line.split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim()));

    // Check if first line is header
    const hasHeader =
      rows[0].some((c) => c.includes('تاريخ') || c.includes('مزرع') || c.includes('صنف') || c.includes('عمود') || c.includes('بند') || c.includes('كمي'));

    const dataRows = hasHeader ? rows.slice(1) : rows;
    const importedTransactions: Transaction[] = [];
    const extractedFarms = new Set<string>();

    for (let i = 0; i < dataRows.length; i++) {
      const r = dataRows[i];
      if (!r || r.length === 0) continue;

      const col0 = r[0] ? String(r[0]).trim() : '';
      const col1 = r[1] ? String(r[1]).trim() : '';
      const col2 = r[2] ? String(r[2]).trim() : '';
      const col3 = r[3] ? String(r[3]).trim() : '';
      const col4 = r[4] ? String(r[4]).trim() : '';
      const col5 = r[5] ? String(r[5]).trim() : '';
      const col6 = r[6] ? String(r[6]).trim() : '';
      const col7 = r[7] ? String(r[7]).trim() : '';
      const col8 = r[8] ? String(r[8]).trim() : '';
      const col9 = r[9] ? String(r[9]).trim() : '';

      // Skip empty or total rows
      if (!col0 && !col1 && !col2) continue;
      if (col0.includes('المجموع') || col1.includes('المجموع')) continue;

      const date = excelSerialToDate(col0);
      const farm = col1 || 'عام';
      if (farm && farm !== 'عام' && farm !== 'مصاريف عامة') {
        extractedFarms.add(farm);
      }

      const category = col2 || 'نثرية ومصروفات';
      const parsedCol3 = parseFloat(col3.replace(/[^\d.-]/g, ''));
      const qty = isNaN(parsedCol3) ? 0 : parsedCol3;

      let unit: string = getDefaultUnitForCategory(category);
      let price = 0;
      let priceUnit: string = getDefaultPriceUnitForCategory(category, unit);
      let notes = '';

      // Check if col4 is unit text
      const isCol4Unit = isNaN(parseFloat(col4.replace(/[^\d.-]/g, ''))) && col4.length > 0 && !col4.startsWith('=');

      if (isCol4Unit) {
        unit = col4;
        const parsedPrice = parseFloat(col5.replace(/[^\d.-]/g, ''));
        price = isNaN(parsedPrice) ? 0 : parsedPrice;

        const isCol6PriceUnit = isNaN(parseFloat(col6.replace(/[^\d.-]/g, ''))) && col6.length > 0 && col6.includes('$');
        if (isCol6PriceUnit) {
          priceUnit = col6;
          notes = col9 || col8 || col7 || '';
        } else {
          priceUnit = getDefaultPriceUnitForCategory(category, unit);
          notes = col8 || col7 || col6 || '';
        }
      } else {
        const parsedPrice = parseFloat(col4.replace(/[^\d.-]/g, ''));
        price = isNaN(parsedPrice) ? 0 : parsedPrice;
        unit = getDefaultUnitForCategory(category);
        priceUnit = getDefaultPriceUnitForCategory(category, unit);
        notes = col7 || col6 || col5 || '';
      }

      if (notes.startsWith('=')) notes = '';

      importedTransactions.push({
        id: 'imp-' + Date.now() + '-' + i,
        date,
        farm,
        category,
        qty,
        unit,
        price,
        priceUnit,
        notes,
      });
    }

    // In Excel, rows are ordered from top (oldest = #1) to bottom (newest = #N).
    // In the App, we display the newest at the top (index 0) down to oldest at the bottom.
    // So we reverse the imported list so the last row in Excel appears at the top of the App with the exact same row number!
    importedTransactions.reverse();

    if (importedTransactions.length === 0) {
      onError('لم يتم العثور على أسطر حركات صالحة في النص المنسوخ');
    } else {
      onComplete({
        transactions: importedTransactions,
        newFarms: Array.from(extractedFarms),
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    onError('حدث خطأ أثناء معالجة النص: ' + msg);
  }
}

/**
 * Parse Excel file (.xlsx, .xls, or .csv) uploaded by user
 */
export function parseExcelFile(
  file: File,
  onComplete: (data: { transactions: Transaction[]; newFarms?: string[] }) => void,
  onError: (err: string) => void
): void {
  if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
    const textReader = new FileReader();
    textReader.onload = (e) => {
      const text = e.target?.result as string;
      if (text && text.includes(';')) {
        parseCSVOrTableText(text, onComplete, onError);
        return;
      }
      readWithXlsx();
    };
    textReader.readAsText(file);
    return;
  }

  readWithXlsx();

  function readWithXlsx() {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetName = workbook.SheetNames.find((s) => s.includes('حرك') || s.includes('يوم')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

        if (!json || json.length <= 1) {
          onError('الملف فارغ أو لا يحتوي على صفوف بيانات صالحة');
          return;
        }

        const rows = json.slice(1);
        const importedTransactions: Transaction[] = [];
        const extractedFarms = new Set<string>();

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0) continue;

          const col0 = r[0] ? String(r[0]).trim() : '';
          const col1 = r[1] ? String(r[1]).trim() : '';
          const col2 = r[2] ? String(r[2]).trim() : '';
          const col3 = r[3] ? String(r[3]).trim() : '';
          const col4 = r[4] ? String(r[4]).trim() : '';
          const col5 = r[5] ? String(r[5]).trim() : '';
          const col6 = r[6] ? String(r[6]).trim() : '';
          const col7 = r[7] ? String(r[7]).trim() : '';
          const col8 = r[8] ? String(r[8]).trim() : '';
          const col9 = r[9] ? String(r[9]).trim() : '';

          if (!col0 && !col1 && !col2 && !col3) continue;
          if (col0.includes('المجموع') || col1.includes('المجموع')) continue;

          const date = excelSerialToDate(col0);
          const farm = col1 || 'عام';
          if (farm && farm !== 'عام' && farm !== 'مصاريف عامة') {
            extractedFarms.add(farm);
          }

          const category = col2 || 'نثرية ومصروفات';
          const parsedCol3 = parseFloat(col3.replace(/[^\d.-]/g, ''));
          const qty = isNaN(parsedCol3) ? 0 : parsedCol3;

          let unit: string = getDefaultUnitForCategory(category);
          let price = 0;
          let priceUnit: string = getDefaultPriceUnitForCategory(category, unit);
          let notes = '';

          const isCol4Unit = isNaN(parseFloat(col4.replace(/[^\d.-]/g, ''))) && col4.length > 0 && !col4.startsWith('=');

          if (isCol4Unit) {
            unit = col4;
            const parsedPrice = parseFloat(col5.replace(/[^\d.-]/g, ''));
            price = isNaN(parsedPrice) ? 0 : parsedPrice;

            const isCol6PriceUnit = isNaN(parseFloat(col6.replace(/[^\d.-]/g, ''))) && col6.length > 0 && col6.includes('$');
            if (isCol6PriceUnit) {
              priceUnit = col6;
              notes = col9 || col8 || col7 || '';
            } else {
              priceUnit = getDefaultPriceUnitForCategory(category, unit);
              notes = col8 || col7 || col6 || '';
            }
          } else {
            const parsedPrice = parseFloat(col4.replace(/[^\d.-]/g, ''));
            price = isNaN(parsedPrice) ? 0 : parsedPrice;
            unit = getDefaultUnitForCategory(category);
            priceUnit = getDefaultPriceUnitForCategory(category, unit);
            notes = col7 || col6 || col5 || '';
          }

          if (notes.startsWith('=')) notes = '';

          importedTransactions.push({
            id: 'imp-' + Date.now() + '-' + i,
            date,
            farm,
            category,
            qty,
            unit,
            price,
            priceUnit,
            notes,
          });
        }

        // In Excel, rows are ordered from top (oldest = #1) to bottom (newest = #N).
        // In the App, we display the newest at the top (index 0) down to oldest at the bottom.
        // So we reverse the imported list so the last row in Excel appears at the top of the App with the exact same row number!
        importedTransactions.reverse();

        if (importedTransactions.length === 0) {
          onError('لم يتم العثور على حركات صالحة في الملف');
        } else {
          onComplete({
            transactions: importedTransactions,
            newFarms: Array.from(extractedFarms),
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        onError('حدث خطأ أثناء قراءة ملف الإكسل: ' + msg);
      }
    };

    reader.onerror = () => onError('فشل قراءة الملف من الجهاز');
    reader.readAsArrayBuffer(file);
  }
}
