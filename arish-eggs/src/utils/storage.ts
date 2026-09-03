import { Transaction, FeedScheduleEntry, FormulasConfig, AutoSyncSettings } from '../types';
import {
  DEFAULT_FARMS,
  DEFAULT_INITIAL_BIRDS,
  DEFAULT_FEED_SCHEDULES,
  DEFAULT_FORMULAS_CONFIG,
  DEFAULT_NOTES_REFERENCE,
  excelSerialToDate,
  getDefaultUnitForCategory,
  getDefaultPriceUnitForCategory,
  calculateRowExpenses,
  calculateRowIncome,
} from './calculations';

export const STORAGE_KEYS = {
  TRANSACTIONS: 'arish_transactions_v2',
  FARMS: 'arish_farms_v2',
  INITIAL_BIRDS: 'arish_initial_birds_v2',
  FEED_SCHEDULES: 'arish_feed_schedules_v2',
  FORMULAS_CONFIG: 'arish_formulas_config_v2',
  NOTES: 'arish_notes_v2',
  UNDO_STACK: 'arish_undo_stack_v2',
  REDO_STACK: 'arish_redo_stack_v2',
  AUTO_SYNC_SETTINGS: 'arish_auto_sync_settings_v2',
  AUTO_SYNC_LOGS: 'arish_auto_sync_logs_v2',
};

export const DEFAULT_AUTO_SYNC_SETTINGS: AutoSyncSettings = {
  enabled: false,
  intervalMinutes: 5,
  syncOnEdit: true,
  lastSyncTime: null,
  lastSyncStatus: 'idle',
  targetType: 'webhook',
};

// Initial zeroed state without forced demo rows
export const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [];

export function loadStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return INITIAL_DEMO_TRANSACTIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_DEMO_TRANSACTIONS;
    return parsed.map((t: Transaction) => ({
      ...t,
      date: excelSerialToDate(t.date),
      unit: t.unit || getDefaultUnitForCategory(t.category),
      priceUnit: t.priceUnit || getDefaultPriceUnitForCategory(t.category, t.unit),
    }));
  } catch {
    return INITIAL_DEMO_TRANSACTIONS;
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage', err);
  }
}

export function loadStoredFarms(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FARMS);
    if (!raw) return DEFAULT_FARMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_FARMS;
  } catch {
    return DEFAULT_FARMS;
  }
}

export function saveStoredFarms(farms: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
  } catch (err) {
    console.error('Failed to save farms to localStorage', err);
  }
}

export function loadStoredInitialBirds(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INITIAL_BIRDS);
    if (!raw) return DEFAULT_INITIAL_BIRDS;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : DEFAULT_INITIAL_BIRDS;
  } catch {
    return DEFAULT_INITIAL_BIRDS;
  }
}

export function saveStoredInitialBirds(birds: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIAL_BIRDS, JSON.stringify(birds));
  } catch (err) {
    console.error('Failed to save initial birds to localStorage', err);
  }
}

export function loadStoredFeedSchedules(): FeedScheduleEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEED_SCHEDULES);
    if (!raw) return DEFAULT_FEED_SCHEDULES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_FEED_SCHEDULES;
  } catch {
    return DEFAULT_FEED_SCHEDULES;
  }
}

export function saveStoredFeedSchedules(schedules: FeedScheduleEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FEED_SCHEDULES, JSON.stringify(schedules));
  } catch (err) {
    console.error('Failed to save feed schedules to localStorage', err);
  }
}

export function loadStoredFormulasConfig(): FormulasConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FORMULAS_CONFIG);
    if (!raw) return DEFAULT_FORMULAS_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      superFeedRatio: parsed.superFeedRatio || DEFAULT_FORMULAS_CONFIG.superFeedRatio,
      eggBoxCartonCount: parsed.eggBoxCartonCount || DEFAULT_FORMULAS_CONFIG.eggBoxCartonCount,
      feedTonBagsCount: parsed.feedTonBagsCount || DEFAULT_FORMULAS_CONFIG.feedTonBagsCount,
      includeEndDateInFeedCalc: typeof parsed.includeEndDateInFeedCalc === 'boolean' ? parsed.includeEndDateInFeedCalc : false,
    };
  } catch {
    return DEFAULT_FORMULAS_CONFIG;
  }
}

export function saveStoredFormulasConfig(config: FormulasConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FORMULAS_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save formulas config to localStorage', err);
  }
}

export function loadStoredNotes(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.NOTES) ?? DEFAULT_NOTES_REFERENCE;
  } catch {
    return DEFAULT_NOTES_REFERENCE;
  }
}

export function saveStoredNotes(notes: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, notes);
  } catch (err) {
    console.error('Failed to save notes to localStorage', err);
  }
}

export function loadStoredUndoStack(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNDO_STACK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function saveStoredUndoStack(stack: any[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.UNDO_STACK, JSON.stringify(stack.slice(0, 100)));
  } catch (err) {
    console.error('Failed to save undo stack to localStorage', err);
  }
}

export function loadStoredRedoStack(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REDO_STACK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function saveStoredRedoStack(stack: any[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REDO_STACK, JSON.stringify(stack.slice(0, 100)));
  } catch (err) {
    console.error('Failed to save redo stack to localStorage', err);
  }
}

export function loadStoredAutoSyncSettings(): AutoSyncSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC_SETTINGS);
    if (!raw) return DEFAULT_AUTO_SYNC_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AUTO_SYNC_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_AUTO_SYNC_SETTINGS;
  }
}

export function saveStoredAutoSyncSettings(settings: AutoSyncSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save auto sync settings to localStorage', err);
  }
}

export function clearAllStorageData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.UNDO_STACK);
    localStorage.removeItem(STORAGE_KEYS.REDO_STACK);
  } catch (e) {
    console.error('Failed to clear storage data', e);
  }
}

// Aliases for convenience
export const loadTransactions = loadStoredTransactions;
export const saveTransactions = saveStoredTransactions;
export const loadFarms = loadStoredFarms;
export const saveFarms = saveStoredFarms;
export const loadInitialBirds = loadStoredInitialBirds;
export const saveInitialBirds = saveStoredInitialBirds;
export const loadFeedSchedules = loadStoredFeedSchedules;
export const saveFeedSchedules = saveStoredFeedSchedules;
export const loadFormulasConfig = loadStoredFormulasConfig;
export const saveFormulasConfig = saveStoredFormulasConfig;
export const loadNotes = loadStoredNotes;
export const saveNotes = saveStoredNotes;

/**
 * Safe file download helper
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (e) {
    console.error('File download error', e);
  }
}

/**
 * Export transactions to standard CSV with explicit Unit & Price Unit columns
 */
export function exportToCSV(transactions: Transaction[], config: FormulasConfig = DEFAULT_FORMULAS_CONFIG): void {
  const headers = [
    'التاريخ',
    'المزرعة',
    'الصنف',
    'الكمية',
    'الوحدة',
    'السعر ($)',
    'وحدة السعر',
    'المصروفات ($)',
    'الإيرادات ($)',
    'ملاحظات',
  ];

  // Export in chronological order: oldest row at top (#1) to newest row at bottom (#N)
  const chronologicalTransactions = [...transactions].reverse();

  const rows = chronologicalTransactions.map((t) => {
    const unit = t.unit || getDefaultUnitForCategory(t.category);
    const priceUnit = t.priceUnit || getDefaultPriceUnitForCategory(t.category, unit);
    const expense = calculateRowExpenses(t.category, t.qty, t.price, unit, priceUnit, config);
    const income = calculateRowIncome(t.category, t.qty, t.price, unit, priceUnit, config);

    return [
      t.date,
      `"${(t.farm || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.qty,
      `"${unit.replace(/"/g, '""')}"`,
      t.price,
      `"${priceUnit.replace(/"/g, '""')}"`,
      expense,
      income,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, `Arish_Eggs_Daily_Movements_${new Date().toISOString().split('T')[0]}.csv`);
}
