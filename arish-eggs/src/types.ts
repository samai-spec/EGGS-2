export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  farm: string;
  category: string;
  qty: number;
  unit?: string; // e.g. "كرتونة" | "صندوق" | "كيس" | "طن" | "وحدة" | "$"
  price: number;
  priceUnit?: string; // e.g. "$/كرتونة" | "$/صندوق" | "$/كيس" | "$/طن" | "$/وحدة" | "$"
  notes: string;
  // Optional dual-input values
  boxQty?: number;
  cartonQty?: number;
  tonQty?: number;
  bagQty?: number;
}

export interface FeedScheduleEntry {
  id: string;
  farm: string;
  startDate: string;
  dailyRate: number; // bags per day (كيس/يوم)
}

export interface FormulasConfig {
  superFeedRatio: number; // default 20 (1 super bag per 20 feed bags)
  eggBoxCartonCount: number; // default 12 (1 box = 12 cartons)
  feedTonBagsCount: number; // default 20 (1 ton = 20 bags)
  includeEndDateInFeedCalc?: boolean; // true: احتساب اليوم المختار، false: عدم احتسابه (default)
}

export interface FarmSummaryRow {
  farm: string;
  expenses: number;
  income: number;
  profit: number;
  eggProduction: number;
  eggLoaded: number;
  eggBalance: number;
  feedSupplied: number;
  feedConsumed: number;
  feedRemaining: number;
  initialBirds: number;
  deaths: number;
  currentBirds: number;
  superStock: number;
  isGeneralRow?: boolean;
  isTotalRow?: boolean;
}

export interface AppStateSnapshot {
  transactions: Transaction[];
  farms: string[];
  initialBirds: Record<string, number>;
  feedSchedules: FeedScheduleEntry[];
  formulasConfig: FormulasConfig;
  notes: string;
  activeTab: number;
}

export interface AutoSyncSettings {
  enabled: boolean;
  intervalMinutes: number; // e.g. 1, 3, 5, 10, 15, 30, 60
  syncOnEdit: boolean;
  lastSyncTime: string | null;
  lastSyncStatus: 'success' | 'error' | 'idle' | 'syncing';
  lastSyncMessage?: string;
  hasPendingOfflineChanges?: boolean;
  targetType: 'webhook' | 'onedrive_cloud' | 'local_autosave';
}

