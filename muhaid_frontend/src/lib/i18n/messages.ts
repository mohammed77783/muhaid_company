import { ar, type Messages } from './ar';
import { en } from './en';
import type { Lang } from './types';

export type { Messages };

export const messages: Record<Lang, Messages> = { ar, en };
