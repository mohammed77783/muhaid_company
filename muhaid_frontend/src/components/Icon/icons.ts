interface IconSpec {
  d: string;
  /** Optional circle: cx, cy, r. */
  c?: [number, number, number];
  /** Directional glyph: mirrors under dir="rtl". Symbolic glyphs never do. */
  dir?: boolean;
}

/* 20px grid, 1.7 stroke, round caps: the same hand as the type's terminals. */
export const icons = {
  check: { d: 'M4 10.5l4 4 8-9' },
  close: { d: 'M5 5l10 10M15 5L5 15' },
  minus: { d: 'M4.5 10h11' },
  clock: { d: 'M10 5.5v4.8l3 1.8', c: [10, 10, 6.6] },
  cloudUp: {
    d: 'M6.5 14.5a3.2 3.2 0 01.2-6.4 4.2 4.2 0 018 .7 2.9 2.9 0 01-.6 5.7H6.5M10 16V9m0 0L8 11m2-2l2 2',
  },
  cloudCheck: {
    d: 'M6.5 14.5a3.2 3.2 0 01.2-6.4 4.2 4.2 0 018 .7 2.9 2.9 0 01-.6 5.7H6.5M7.8 11.4l1.8 1.8 3.3-3.6',
  },
  cloudFail: {
    d: 'M6.5 14.5a3.2 3.2 0 01.2-6.4 4.2 4.2 0 018 .7 2.9 2.9 0 01-.6 5.7H6.5M8.3 9.8l3.6 3.6M11.9 9.8l-3.6 3.6',
  },
  wifiOff: {
    d: 'M3 7.4a12 12 0 013.6-2M17 7.4a12 12 0 00-3.3-1.9M6 10.4a7.6 7.6 0 012-1.2M14 10.4a7.6 7.6 0 00-1.6-1M8.6 13.2a3.6 3.6 0 012.8 0M10 16.2h.01M3 3l14 14',
  },
  alert: { d: 'M10 7.2v4.2M10 14h.01M10 3.4l7 12.2H3l7-12.2z' },
  info: { d: 'M10 9.4v4.4M10 6.6h.01', c: [10, 10, 7] },
  camera: {
    d: 'M3.2 7.6h2.3l1.2-1.8h6.6l1.2 1.8h2.3v8.2H3.2V7.6z M10 14.2a2.6 2.6 0 100-5.2 2.6 2.6 0 000 5.2z',
  },
  imageOff: {
    d: 'M3.2 4.2h13.6v11.6H3.2V4.2z M3.2 13l3.6-3.4 2.6 2.4M12 8.4h.01M3 3l14 14',
  },
  search: { d: 'M15.4 15.4l-3-3', c: [8.6, 8.6, 5.2] },
  filter: { d: 'M3.4 5.4h13.2M5.8 10h8.4M8.4 14.6h3.2' },
  calendar: { d: 'M3.4 5.6h13.2v11H3.4v-11z M3.4 9h13.2M6.8 3.6v3M13.2 3.6v3' },
  chevronDown: { d: 'M5.4 8l4.6 4.6L14.6 8' },
  chevronEnd: { d: 'M8 5.4l4.6 4.6L8 14.6', dir: true },
  arrowEnd: { d: 'M4 10h11M10.6 5.6L15 10l-4.4 4.4', dir: true },
  arrowStart: { d: 'M16 10H5M9.4 5.6L5 10l4.4 4.4', dir: true },
  drag: {
    d: 'M7.4 5.6h.01M7.4 10h.01M7.4 14.4h.01M12.6 5.6h.01M12.6 10h.01M12.6 14.4h.01',
  },
  trash: { d: 'M4.4 6.4h11.2M8 6.4V4.6h4v1.8M6 6.4l.8 9.4h6.4l.8-9.4' },
  plus: { d: 'M10 4.6v10.8M4.6 10h10.8' },
  user: {
    d: 'M4.4 16.4c0-2.6 2.5-4.4 5.6-4.4s5.6 1.8 5.6 4.4',
    c: [10, 7.2, 3.1],
  },
  folder: { d: 'M3.2 5.4h4.6l1.4 2h7.6v9H3.2v-11z' },
  clipboard: {
    d: 'M7.2 4.4H5.4v12h9.2v-12h-1.8M7.2 4.4V3.2h5.6v1.2H7.2z M8 9h4M8 12.2h4',
  },
  printer: {
    d: 'M6 7.4V3.6h8v3.8M6 14.6H3.8V7.4h12.4v7.2H14M6 11.6h8v4.8H6v-4.8z',
  },
  refresh: { d: 'M16 10a6 6 0 11-2.1-4.6M16.4 3.6v3.4h-3.4' },
  lock: { d: 'M5.6 9h8.8v7.2H5.6V9z M7.6 9V6.8a2.4 2.4 0 014.8 0V9' },
  logout: {
    d: 'M8 16.4H3.6V3.6H8M11.4 6.6L14.8 10l-3.4 3.4M14.8 10H7.6',
    dir: true,
  },
  more: { d: 'M5.2 10h.01M10 10h.01M14.8 10h.01' },
  eye: {
    d: 'M1.8 10S4.6 5 10 5s8.2 5 8.2 5-2.8 5-8.2 5-8.2-5-8.2-5z',
    c: [10, 10, 2.2],
  },
  building: {
    d: 'M4.4 16.4V4.4h7.2v12M11.6 8.6h4v7.8M7 7.4h2M7 10.4h2M7 13.4h2',
  },
  hardhat: {
    d: 'M3.4 13.4h13.2v1.8H3.4v-1.8z M5.2 13.4V10a4.8 4.8 0 019.6 0v3.4M8.4 5.6V4.4h3.2v1.2',
  },
} satisfies Record<string, IconSpec>;

export type IconName = keyof typeof icons;
