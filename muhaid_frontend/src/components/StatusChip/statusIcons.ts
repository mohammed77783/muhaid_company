import type { IconName } from '../Icon';

export type AnswerStatus = 'yes' | 'no' | 'na';
export type SyncStatus = 'pending' | 'sending' | 'sent' | 'failed';
export type TemplateStatus = 'upcoming' | 'active' | 'ended';
export type UserStatus = 'userActive' | 'deactivated';
/** The system's whole status vocabulary. The words live in the dictionary (t.status). */
export type Status = AnswerStatus | SyncStatus | TemplateStatus | UserStatus;

/* Status glyphs are fixed to their states and are not interchangeable. */
export const statusIcons: Record<Status, IconName> = {
  yes: 'check',
  no: 'close',
  na: 'minus',
  pending: 'clock',
  sending: 'cloudUp',
  sent: 'cloudCheck',
  failed: 'cloudFail',
  upcoming: 'calendar',
  active: 'check',
  ended: 'minus',
  userActive: 'check',
  deactivated: 'lock',
};
