import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Person, ConversationLog } from '../types';

const BACKUP_VERSION = 1;

export type BackupData = {
  version: number;
  exportedAt: string;
  persons: Person[];
  logs: ConversationLog[];
};

function dateStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// ─── JSON エクスポート ───────────────────────────────────────────────────────
export async function exportJson(persons: Person[], logs: ConversationLog[]): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('この端末では共有機能が利用できません');
  }
  if (!FileSystem.cacheDirectory) {
    throw new Error('キャッシュディレクトリが取得できませんでした');
  }

  const payload: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    persons,
    logs,
  };
  const json = JSON.stringify(payload, null, 2);
  const path = `${FileSystem.cacheDirectory}karte_backup_${dateStamp()}.json`;

  try {
    await FileSystem.writeAsStringAsync(path, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (e) {
    console.error('[backup] write error:', e);
    throw e;
  }

  try {
    await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'バックアップを共有' });
  } catch (e) {
    console.error('[backup] share error:', e);
    throw e;
  }
}

// ─── CSV エクスポート ────────────────────────────────────────────────────────
function escapeCsv(value: string | undefined): string {
  if (!value) return '';
  const escaped = value.replace(/"/g, '""');
  return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export async function exportCsv(persons: Person[]): Promise<void> {
  const header = ['名前', '所属', '関係性', 'タグ', '趣味・特技', '出身地', 'メモ', '登録日'];
  const rows = persons.map((p) => [
    escapeCsv(p.name),
    escapeCsv(p.organization),
    escapeCsv(p.relationship),
    escapeCsv(p.tags.join('/')),
    escapeCsv(p.hobby),
    escapeCsv(p.hometown),
    escapeCsv(p.note),
    escapeCsv(p.createdAt.slice(0, 10)),
  ]);
  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  // BOM付きUTF-8（Excelで文字化けしないように）
  const path = `${FileSystem.cacheDirectory}karte_persons_${dateStamp()}.csv`;
  await FileSystem.writeAsStringAsync(path, '\uFEFF' + csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: '人物データを共有' });
}

// ─── JSON インポート ─────────────────────────────────────────────────────────
export type ImportResult = {
  newPersons: Person[];
  newLogs: ConversationLog[];
};

export async function importJson(
  existingPersons: Person[],
  existingLogs: ConversationLog[]
): Promise<ImportResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const raw = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let data: BackupData;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('JSONの形式が正しくありません');
  }

  if (!Array.isArray(data.persons) || !Array.isArray(data.logs)) {
    throw new Error('バックアップファイルの形式が正しくありません');
  }

  const existingPersonIds = new Set(existingPersons.map((p) => p.id));
  const existingLogIds = new Set(existingLogs.map((l) => l.id));

  const newPersons = (data.persons as Person[]).filter((p) => !existingPersonIds.has(p.id));
  const newLogs = (data.logs as ConversationLog[]).filter((l) => !existingLogIds.has(l.id));

  return { newPersons, newLogs };
}
