import { Transaction, FeedScheduleEntry, FormulasConfig, FarmSummaryRow } from '../types';

export const DEFAULT_FARMS: string[] = [];

export const DEFAULT_INITIAL_BIRDS: Record<string, number> = {};

// Core categories for quick selection
export const CORE_CATEGORY_OPTIONS = [
  'بيض تحميل',
  'بيض انتاج',
  'مدخول',
  'علف',
];

export const CATEGORY_OPTIONS = CORE_CATEGORY_OPTIONS;

export const DEFAULT_FORMULAS_CONFIG: FormulasConfig = {
  superFeedRatio: 20, // 1 bag super per 20 bags feed
  eggBoxCartonCount: 12, // 1 box = 12 cartons
  feedTonBagsCount: 20, // 1 ton = 20 bags
  includeEndDateInFeedCalc: false, // افتراضياً: لا يحتسب اليوم المحدد
};

export const DEFAULT_FEED_SCHEDULES: FeedScheduleEntry[] = [];

export const DEFAULT_NOTES_REFERENCE = `• 1 طن علف = 20 كيس (50 كغ للكيس)
• مخزون super: (مجموع أكياس super الواردة - مجموع أكياس العلف / 20)
• بيض المائدة: (1 صندوق = 12 كرتونة = 360 بيضة)
• حساب استهلاك العلف اليومي: معدل الأكياس اليومي × عدد الأيام`;

/**
 * Format numbers using standard Western numerals (123)
 */
export function formatWesternNumber(num: number | undefined | null, decimals: number = 0): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts Excel Serial number (e.g. 46194) or standard string to YYYY-MM-DD
 * Fixed to prevent 1-day subtraction caused by UTC/Timezone shifts!
 */
export function excelSerialToDate(serialOrDate: string | number | undefined | null): string {
  if (!serialOrDate) return formatDateToYYYYMMDD(new Date());
  
  const str = String(serialOrDate).trim();
  const num = Number(str);

  // Excel serial number between 1980 and 2060
  if (!isNaN(num) && num > 25000 && num < 65000) {
    // Excel epoch begins 1899-12-30 (taking into account the 1900 leap year quirk)
    const epochDays = num - 25569;
    const utcMs = Math.round(epochDays * 86400 * 1000);
    const dateObj = new Date(utcMs);
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Matches YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Matches DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatDateToYYYYMMDD(parsed);
  }

  return str;
}

export function isEggProductionCategory(category: string): boolean {
  if (!category) return false;
  const cat = category.trim().toLowerCase();
  return (cat.includes('بيض') && (cat.includes('انتاج') || cat.includes('إنتاج'))) || cat === 'انتاج بيض' || cat === 'إنتاج بيض';
}

export function isEggLoadedCategory(category: string): boolean {
  if (!category) return false;
  const cat = category.trim().toLowerCase();
  return (cat.includes('بيض') && cat.includes('تحميل')) || cat === 'تحميل بيض' || cat.includes('مبيعات بيض');
}

export function isFeedCategory(category: string): boolean {
  if (!category) return false;
  const cat = category.trim().toLowerCase();
  return cat.includes('علف') || cat === 'درة';
}

export function isSuperCategory(category: string): boolean {
  if (!category) return false;
  const cat = category.trim().toLowerCase();
  return cat === 'super' || cat.startsWith('super') || cat.includes('سوبر');
}

/**
 * Enhanced check for death/mortality category (وفيات / نفوق / موت / طيور نافقة)
 */
export function isDeathCategory(category: string): boolean {
  if (!category) return false;
  const cat = category.trim().toLowerCase();
  return (
    cat.includes('وفيات') ||
    cat.includes('وفاة') ||
    cat.includes('وفاه') ||
    cat.includes('نفوق') ||
    cat.includes('موت') ||
    cat.includes('نافق') ||
    cat.includes('طير ميت') ||
    cat.includes('صيصان ميت') ||
    cat.includes('هلاك')
  );
}

/**
 * Returns available units tailored strictly to the selected category:
 * - علف: كيس، طن
 * - بيض: كرتونة، صندوق
 * - سوبر: كيس، طن
 * - غير ذلك: وحدة، طير، لتر، علبة، ربطة، $
 */
export function getAvailableUnitsForCategory(category: string): string[] {
  const cat = (category || '').trim().toLowerCase();
  let units: string[] = [];

  // 1. Egg categories -> Carton or Box only
  if (cat.includes('بيض')) {
    units = ['كرتونة', 'صندوق'];
  } else if (cat.includes('علف') || cat.includes('super') || cat.includes('سوبر') || cat === 'درة') {
    // 2. Feed & Super categories -> Bag or Ton only
    units = ['كيس', 'طن'];
  } else if (isDeathCategory(cat) || cat.includes('صوص') || cat.includes('طير') || cat.includes('دجاج')) {
    // 3. Deaths / Birds
    units = ['طير', 'رأس', 'وحدة'];
  } else if (cat.includes('كرتون')) {
    // 4. Cartons / Packaging
    units = ['ربطة', 'كرتونة', 'وحدة', '$'];
  } else if (cat.includes('مازوت') || cat.includes('بنزين')) {
    // 5. Fuel / Oil / Gas
    units = ['لتر', 'برميل', 'وحدة', '$'];
  } else if (cat.includes('غاز')) {
    units = ['جرة', 'وحدة', '$'];
  } else if (
    cat.includes('دوا') ||
    cat.includes('طعم') ||
    cat.includes('vitamin') ||
    cat.includes('فيتامين') ||
    cat.includes('بيطري')
  ) {
    // 6. Medicines & Veterinary
    units = ['علبة', 'جرعة', 'لتر', 'وحدة', '$'];
  } else if (
    cat === 'مدخول' ||
    cat.includes('مدخول') ||
    cat.includes('راتب') ||
    cat.includes('عمالة') ||
    cat.includes('أجار') ||
    cat.includes('اجار') ||
    cat.includes('اشتراك') ||
    cat.includes('صيانة') ||
    cat.includes('مصاريف') ||
    cat.includes('نثرية') ||
    cat.includes('إيراد') ||
    cat.includes('ايراد') ||
    cat.includes('زبل')
  ) {
    // 7. General financial entries & Income (مدخول)
    units = ['$', 'وحدة', 'دفعة', 'شهر', 'عدد'];
  } else {
    // 8. Default for other / custom categories
    units = ['وحدة', 'كيس', 'كرتونة', 'صندوق', 'طن', 'طير', 'علبة', 'لتر', 'ربطة', '$'];
  }

  return Array.from(new Set(units));
}

/**
 * Default unit strictly matching user mandate:
 * - العلف: كيس
 * - البيض: كرتونة
 * - سوبر: كيس
 * - أي خيار غير ذلك: وحدة
 */
export function getDefaultUnitForCategory(category: string): string {
  const cat = (category || '').trim().toLowerCase();
  if (cat.includes('علف') || cat === 'درة') return 'كيس';
  if (cat.includes('بيض')) return 'كرتونة';
  if (cat.includes('super') || cat.includes('سوبر')) return 'كيس';
  if (isDeathCategory(cat)) return 'طير';
  return 'وحدة';
}

export function getAvailablePriceUnitsForCategory(category: string, currentUnit?: string): string[] {
  const cat = (category || '').trim().toLowerCase();
  const u = (currentUnit || getDefaultUnitForCategory(category)).trim();
  let units: string[] = [];

  if (cat.includes('بيض')) {
    units = ['$/كرتونة', '$/صندوق', '$'];
  } else if (cat.includes('علف') || cat.includes('super') || cat.includes('سوبر') || cat === 'درة') {
    units = ['$/كيس', '$/طن', '$'];
  } else if (isDeathCategory(cat)) {
    units = ['$/طير', '$/وحدة', '$'];
  } else if (cat.includes('مازوت') || cat.includes('بنزين')) {
    units = ['$/لتر', '$/برميل', '$'];
  } else if (cat.includes('غاز')) {
    units = ['$/جرة', '$'];
  } else if (cat.includes('كرتون')) {
    units = ['$/ربطة', '$/كرتونة', '$'];
  } else if (cat.includes('دوا') || cat.includes('طعم') || cat.includes('بيطري')) {
    units = ['$/علبة', '$/جرعة', '$'];
  } else {
    const dynamicUnit = u && u !== '$' ? `$/${u}` : '$/وحدة';
    units = [dynamicUnit, '$', '$/كيس', '$/كرتونة', '$/صندوق', '$/طن', '$/طير', '$/لتر', '$/علبة', '$/وحدة'];
  }

  if (u && u !== '$') {
    const dynamicU = `$/${u}`;
    if (!units.includes(dynamicU)) {
      units.unshift(dynamicU);
    }
  }

  return Array.from(new Set(units));
}

/**
 * Default price unit matches quantity unit automatically: ($ / وحدة الكمية)
 */
export function getDefaultPriceUnitForCategory(category: string, unit?: string): string {
  const cat = (category || '').trim().toLowerCase();
  const u = (unit || getDefaultUnitForCategory(category)).trim();

  if (cat.includes('بيض')) {
    if (u === 'صندوق') return '$/صندوق';
    return '$/كرتونة';
  }
  if (cat.includes('علف') || cat.includes('super') || cat.includes('سوبر') || cat === 'درة') {
    if (u === 'طن') return '$/طن';
    return '$/كيس';
  }
  if (isDeathCategory(cat)) {
    return '$/طير';
  }
  if (u === '$') {
    return '$';
  }
  if (u) {
    return `$/${u}`;
  }
  return '$/وحدة';
}

/**
 * Helper to compute effective quantity if dual-input is provided (e.g. 10 boxes + 9 cartons -> 129 cartons)
 */
export function computeCompositeEggQuantity(boxQty: number, cartonQty: number, boxCartonRatio: number = 12): { totalCartons: number; totalBoxes: number } {
  const b = Number(boxQty) || 0;
  const c = Number(cartonQty) || 0;
  const totalCartons = b * boxCartonRatio + c;
  const totalBoxes = boxCartonRatio > 0 ? totalCartons / boxCartonRatio : b;
  return { totalCartons, totalBoxes };
}

/**
 * Helper to compute effective quantity if dual-input is provided (e.g. 5 tons + 10 bags -> 110 bags)
 */
export function computeCompositeFeedQuantity(tonQty: number, bagQty: number, tonBagsRatio: number = 20): { totalBags: number; totalTons: number } {
  const t = Number(tonQty) || 0;
  const b = Number(bagQty) || 0;
  const totalBags = t * tonBagsRatio + b;
  const totalTons = tonBagsRatio > 0 ? totalBags / tonBagsRatio : t;
  return { totalBags, totalTons };
}

/**
 * Calculates effective financial amount taking into account mismatch between Qty Unit and Price Unit
 */
export function calculateEffectiveAmount(
  category: string,
  qty: number,
  price: number,
  unit?: string,
  priceUnit?: string,
  config: FormulasConfig = DEFAULT_FORMULAS_CONFIG
): number {
  const q = Number(qty) || 0;
  const p = Number(price) || 0;
  if (q === 0 || p === 0) return 0;

  const cat = (category || '').trim().toLowerCase();
  const u = (unit || getDefaultUnitForCategory(category)).trim().toLowerCase();
  const pu = (priceUnit || getDefaultPriceUnitForCategory(category, u)).trim().toLowerCase();

  // Egg conversions
  if (cat.includes('بيض')) {
    const boxRatio = config.eggBoxCartonCount || 12;
    // Quantity in boxes, price per carton -> Total = (Qty * BoxRatio) * Price
    if ((u === 'صندوق' || u === 'box') && (pu === '$/كرتونة' || pu === 'كرتونة')) {
      return Number((q * boxRatio * p).toFixed(2));
    }
    // Quantity in cartons, price per box -> Total = (Qty / BoxRatio) * Price
    if ((u === 'كرتونة' || u === 'carton') && (pu === '$/صندوق' || pu === 'صندوق')) {
      return Number(((q / boxRatio) * p).toFixed(2));
    }
  }

  // Feed conversions
  if (cat.includes('علف') || cat.includes('super') || cat.includes('سوبر') || cat === 'درة') {
    const tonRatio = config.feedTonBagsCount || 20;
    // Quantity in tons, price per bag -> Total = (Qty * TonRatio) * Price
    if ((u === 'طن' || u === 'ton') && (pu === '$/كيس' || pu === 'كيس')) {
      return Number((q * tonRatio * p).toFixed(2));
    }
    // Quantity in bags, price per ton -> Total = (Qty / TonRatio) * Price
    if ((u === 'كيس' || u === 'bag') && (pu === '$/طن' || pu === 'طن')) {
      return Number(((q / tonRatio) * p).toFixed(2));
    }
  }

  return Number((q * p).toFixed(2));
}

/**
 * Standardize quantity into base units (cartons for eggs, bags for feed/super, birds for deaths)
 */
export function getStandardizedQuantity(
  category: string,
  qty: number,
  unit?: string,
  config: FormulasConfig = DEFAULT_FORMULAS_CONFIG
): number {
  const val = Number(qty) || 0;
  const cat = (category || '').trim().toLowerCase();
  const u = (unit || getDefaultUnitForCategory(category)).trim().toLowerCase();

  // Egg units -> Standardize to Cartons (كراتين)
  if (cat.includes('بيض')) {
    if (u === 'صندوق' || u === 'box') {
      const cartonRatio = config.eggBoxCartonCount || 12;
      return val * cartonRatio;
    }
    return val;
  }

  // Feed units -> Standardize to Bags (أكياس)
  if (cat.includes('علف') || cat === 'درة') {
    if (u === 'طن' || u === 'ton') {
      const bagsPerTon = config.feedTonBagsCount || 20;
      return val * bagsPerTon;
    }
    return val;
  }

  // Super units -> Standardize to Bags (أكياس)
  if (cat === 'super' || cat.includes('سوبر')) {
    if (u === 'طن' || u === 'ton') {
      const bagsPerTon = config.feedTonBagsCount || 20;
      return val * bagsPerTon;
    }
    return val;
  }

  return val;
}

/**
 * Calculate row expenses:
 * IF category is egg production OR egg loading OR deaths OR income/مدخول, expense is 0; else calculated amount.
 */
export function calculateRowExpenses(
  category: string,
  qty: number,
  price: number,
  unit?: string,
  priceUnit?: string,
  config: FormulasConfig = DEFAULT_FORMULAS_CONFIG
): number {
  if (!category) return 0;
  if (isEggProductionCategory(category) || isEggLoadedCategory(category) || isDeathCategory(category)) {
    return 0;
  }
  const cat = category.trim().toLowerCase();
  if (
    cat === 'مدخول' ||
    cat.includes('مدخول') ||
    cat === 'إيراد متنوع' ||
    cat === 'ايراد متنوع' ||
    cat === 'زبل' ||
    cat.includes('مبيعات') ||
    cat.includes('إيراد') ||
    cat.includes('ايراد')
  ) {
    return 0;
  }
  return calculateEffectiveAmount(category, qty, price, unit, priceUnit, config);
}

/**
 * Calculate row income:
 * IF category is egg loading OR other income (مدخول، زبل، إيراد), income is calculated amount; else 0.
 */
export function calculateRowIncome(
  category: string,
  qty: number,
  price: number,
  unit?: string,
  priceUnit?: string,
  config: FormulasConfig = DEFAULT_FORMULAS_CONFIG
): number {
  if (!category) return 0;
  if (isEggLoadedCategory(category)) {
    return calculateEffectiveAmount(category, qty, price, unit, priceUnit, config);
  }
  const cat = category.trim().toLowerCase();
  if (
    cat === 'مدخول' ||
    cat.includes('مدخول') ||
    cat === 'إيراد متنوع' ||
    cat === 'ايراد متنوع' ||
    cat === 'زبل' ||
    cat.includes('مبيعات') ||
    cat.includes('إيراد') ||
    cat.includes('ايراد')
  ) {
    return calculateEffectiveAmount(category, qty, price, unit, priceUnit, config);
  }
  return 0;
}

/**
 * Calculate farm feed consumed based on feed schedules
 * includeEndDate: إذا كانت true يتم احتساب اليوم المختار في التاريخ، وإذا كانت false (الافتراضي) لا يتم احتسابه.
 */
export function calculateFarmFeedConsumed(
  farmName: string,
  schedules: FeedScheduleEntry[],
  currentDateStr: string = formatDateToYYYYMMDD(new Date()),
  includeEndDate: boolean = false
): number {
  const farmSchedules = schedules
    .filter((s) => s.farm === farmName && s.dailyRate > 0 && s.startDate)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  if (farmSchedules.length === 0) return 0;

  const targetDate = new Date(currentDateStr);
  let totalConsumed = 0;

  for (let i = 0; i < farmSchedules.length; i++) {
    const start = new Date(farmSchedules[i].startDate);
    if (isNaN(start.getTime()) || start > targetDate) continue;

    const nextSchedule = farmSchedules[i + 1];
    let end = targetDate;
    if (nextSchedule) {
      const nextStart = new Date(nextSchedule.startDate);
      if (!isNaN(nextStart.getTime()) && nextStart <= targetDate) {
        end = new Date(nextStart.getTime() - 86400000);
      }
    }

    // الفرق بالأيام:
    // إذا كان includeEndDate = true: يتم احتساب الأيام شاملة اليوم الأخير (+1)
    // إذا كان includeEndDate = false: يتم احتساب الأيام حتى اليوم السابق (بدون +1)
    const rawDiffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const diffDays = Math.max(0, includeEndDate ? rawDiffDays + 1 : rawDiffDays);
    totalConsumed += diffDays * farmSchedules[i].dailyRate;
  }

  return Number(totalConsumed.toFixed(1));
}

/**
 * Calculate Summary Matrix for all farms, General Row, and Total Row
 */
export function calculateAllSummaries(
  transactions: Transaction[],
  farms: string[],
  initialBirds: Record<string, number>,
  schedules: FeedScheduleEntry[],
  config: FormulasConfig = DEFAULT_FORMULAS_CONFIG
): FarmSummaryRow[] {
  const includeEndDate = !!config.includeEndDateInFeedCalc;
  // Global Super stock calculation:
  // Total super bags supplied - (Total feed bags supplied across all farms / superFeedRatio)
  const totalSuperBags = transactions
    .filter((t) => isSuperCategory(t.category))
    .reduce((sum, t) => sum + getStandardizedQuantity(t.category, t.qty, t.unit, config), 0);

  const totalFeedBagsAll = transactions
    .filter((t) => isFeedCategory(t.category))
    .reduce((sum, t) => sum + getStandardizedQuantity(t.category, t.qty, t.unit, config), 0);

  const superRatio = config.superFeedRatio > 0 ? config.superFeedRatio : 20;
  const globalSuperStock = Number((totalSuperBags - totalFeedBagsAll / superRatio).toFixed(2));

  const rows: FarmSummaryRow[] = [];

  // 1. Regular Farms Rows
  for (const farm of farms) {
    const farmTrans = transactions.filter((t) => t.farm === farm);

    const expenses = farmTrans.reduce(
      (sum, t) => sum + calculateRowExpenses(t.category, Number(t.qty) || 0, Number(t.price) || 0, t.unit, t.priceUnit, config),
      0
    );

    const income = farmTrans.reduce(
      (sum, t) => sum + calculateRowIncome(t.category, Number(t.qty) || 0, Number(t.price) || 0, t.unit, t.priceUnit, config),
      0
    );

    const profit = income - expenses;

    // Egg Production (cartons)
    const eggProduction = farmTrans
      .filter((t) => isEggProductionCategory(t.category))
      .reduce((sum, t) => sum + getStandardizedQuantity(t.category, t.qty, t.unit, config), 0);

    // Egg Loaded (cartons)
    const eggLoaded = farmTrans
      .filter((t) => isEggLoadedCategory(t.category))
      .reduce((sum, t) => sum + getStandardizedQuantity(t.category, t.qty, t.unit, config), 0);

    const eggBalance = eggProduction - eggLoaded;

    // Feed Supplied (bags)
    const feedSupplied = farmTrans
      .filter((t) => isFeedCategory(t.category))
      .reduce((sum, t) => sum + getStandardizedQuantity(t.category, t.qty, t.unit, config), 0);

    const feedConsumed = calculateFarmFeedConsumed(farm, schedules, undefined, includeEndDate);
    const feedRemaining = Number((feedSupplied - feedConsumed).toFixed(1));

    const initial = initialBirds[farm] || 0;
    // Deaths properly deducted for mortality entries
    const deaths = farmTrans
      .filter((t) => isDeathCategory(t.category))
      .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

    const currentBirds = Math.max(0, initial - deaths);

    rows.push({
      farm,
      expenses: Number(expenses.toFixed(2)),
      income: Number(income.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      eggProduction,
      eggLoaded,
      eggBalance,
      feedSupplied,
      feedConsumed,
      feedRemaining,
      initialBirds: initial,
      deaths,
      currentBirds,
      superStock: 0,
    });
  }

  // 2. General Row (حسابات عامة ومخزون السوبر) - Labeled "عام" as requested
  const generalTrans = transactions.filter((t) => t.farm === 'عام' || t.farm === 'مصاريف عامة' || !t.farm);
  const generalExpenses = generalTrans.reduce(
    (sum, t) => sum + calculateRowExpenses(t.category, Number(t.qty) || 0, Number(t.price) || 0, t.unit, t.priceUnit, config),
    0
  );
  const generalIncome = generalTrans.reduce(
    (sum, t) => sum + calculateRowIncome(t.category, Number(t.qty) || 0, Number(t.price) || 0, t.unit, t.priceUnit, config),
    0
  );
  const generalProfit = generalIncome - generalExpenses;

  rows.push({
    farm: 'عام',
    expenses: Number(generalExpenses.toFixed(2)),
    income: Number(generalIncome.toFixed(2)),
    profit: Number(generalProfit.toFixed(2)),
    eggProduction: 0,
    eggLoaded: 0,
    eggBalance: 0,
    feedSupplied: 0,
    feedConsumed: 0,
    feedRemaining: 0,
    initialBirds: 0,
    deaths: 0,
    currentBirds: 0,
    superStock: globalSuperStock,
    isGeneralRow: true,
  });

  // 3. Grand Total Row (المجموع الإجمالي)
  const totalExpenses = rows.reduce((sum, r) => sum + r.expenses, 0);
  const totalIncome = rows.reduce((sum, r) => sum + r.income, 0);
  const totalProfit = totalIncome - totalExpenses;
  const totalEggProd = rows.reduce((sum, r) => sum + r.eggProduction, 0);
  const totalEggLoaded = rows.reduce((sum, r) => sum + r.eggLoaded, 0);
  const totalEggBalance = totalEggProd - totalEggLoaded;
  const totalFeedSupplied = rows.reduce((sum, r) => sum + r.feedSupplied, 0);
  const totalFeedConsumed = rows.reduce((sum, r) => sum + r.feedConsumed, 0);
  const totalFeedRemaining = Number((totalFeedSupplied - totalFeedConsumed).toFixed(1));
  const totalInitialBirds = rows.reduce((sum, r) => sum + r.initialBirds, 0);
  const totalDeaths = rows.reduce((sum, r) => sum + r.deaths, 0);
  const totalCurrentBirds = rows.reduce((sum, r) => sum + r.currentBirds, 0);

  rows.push({
    farm: 'المجموع الإجمالي',
    expenses: Number(totalExpenses.toFixed(2)),
    income: Number(totalIncome.toFixed(2)),
    profit: Number(totalProfit.toFixed(2)),
    eggProduction: totalEggProd,
    eggLoaded: totalEggLoaded,
    eggBalance: totalEggBalance,
    feedSupplied: totalFeedSupplied,
    feedConsumed: totalFeedConsumed,
    feedRemaining: totalFeedRemaining,
    initialBirds: totalInitialBirds,
    deaths: totalDeaths,
    currentBirds: totalCurrentBirds,
    superStock: globalSuperStock,
    isTotalRow: true,
  });

  return rows;
}
