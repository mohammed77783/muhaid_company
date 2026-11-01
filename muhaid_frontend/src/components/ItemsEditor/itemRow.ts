export const MAX_ITEMS = 50;
export const MAX_ITEM_LENGTH = 500;

export interface ItemRow {
  /** Stable across reordering, so React keeps each field. Never sent to the server. */
  key: string;
  text: string;
}

export function newRow(text = ''): ItemRow {
  return { key: crypto.randomUUID(), text };
}
