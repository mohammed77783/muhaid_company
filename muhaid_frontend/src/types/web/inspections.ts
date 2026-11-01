import type {
  AnswerValue,
  InspectionDetail,
  PageParams,
  TemplateItem,
} from '../api';

export interface AnswerInput {
  itemId: string;
  answer: AnswerValue;
  /** Required when answer is 'no'. */
  note?: string | null;
}

export interface ListMyInspectionsParams extends PageParams {
  /** Exact match. Sent only when it isn't empty. */
  workOrder?: string;
}

export interface SubmitResult {
  /** true for 201 (stored now), false for 200 (already stored: a retry). */
  created: boolean;
  inspection: InspectionDetail;
}

/** 'syncing' is a request in flight. Offline is 'pending', never 'failed'. */
export type OutboxStatus = 'pending' | 'syncing' | 'failed';

export interface OutboxError {
  status: number;
  messages: string[];
  body: Record<string, unknown>;
}

/** A saved inspection the server has not confirmed: the only copy of this work. */
export interface OutboxRecord {
  /** crypto.randomUUID(), created when the form is saved. Never regenerated on retry. */
  id: string;
  /** The inspector who filled it. Only this user's token may send it. */
  inspectorId: string;
  templateId: string;
  templateName: string;
  projectCode: string;
  /** Items at the time of filling, so the entry can be shown without the network. */
  itemsSnapshot: TemplateItem[];
  workOrderNumber: string;
  /** new Date().toISOString() at save time. */
  filledAt: string;
  answers: AnswerInput[];
  photo: Blob;
  status: OutboxStatus;
  attempts: number;
  /** Set when the server rejected it with a non-retryable 4xx. */
  lastError?: OutboxError;
}

/** What the form hands over when the inspector saves. */
export interface DraftInput {
  answersByItem: Record<string, { answer: AnswerValue; note: string }>;
  photo: Blob;
}
