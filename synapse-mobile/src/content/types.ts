export type Article = {
  id: string; title: string; category: string; paragraphs: string[]; preview: string[];
  source: string; revision?: number; fetchedAt: number; saved?: boolean; readAt?: number;
  simplified?: string[];
  simplifiedVersion?: number;
  simplifiedPreview?: string;
  simplifiedInput?: string;
  simplifiedPrepared?: boolean;
  complete?: boolean;
  textVersion?: number;
  contentIssue?: string;
  contentIssueKind?: 'network'|'limit'|'content'|'offline';
};
export type Category = { id: string; label: string; wiki: string; seeds: string[] };
export type Settings = { dark: boolean; size: number; categories: string[]; aiEnabled: boolean };
export const DEFAULT_SETTINGS: Settings = { dark: false, size: 20, categories: [], aiEnabled: false };
