/** ISO 8601 UTC timestamp from the server, e.g. "2026-10-31T09:15:00.000Z". */
export type IsoDateTime = string;
/** Calendar date, exactly "YYYY-MM-DD". Never parse it with `new Date()`. */
export type CalendarDate = string;

export type Role = 'admin' | 'inspector';
export type AnswerValue = 'yes' | 'no' | 'na';

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  /** Rows matching the filters across all pages. */
  total: number;
}

export interface PageParams {
  page?: number; // default 1
  limit?: number; // default 20, max 50
}

export interface ProjectRef {
  id: string;
  code: string;
  name: string;
}

export interface TemplateItem {
  id: string;
  position: number;
  label: string;
}

export interface InspectionSummary {
  id: string;
  workOrderNumber: string;
  filledAt: IsoDateTime;
  receivedAt: IsoDateTime;
  template: { id: string; name: string };
  project: ProjectRef;
  inspector: { id: string; name: string };
}

export interface InspectionAnswer {
  itemId: string;
  position: number;
  /** Question text as it was when the inspection was submitted. */
  label: string;
  answer: AnswerValue;
  note: string | null;
}

export interface InspectionDetail extends InspectionSummary {
  /** Path relative to the API base, e.g. "/web/inspections/<id>/photo". */
  photoUrl: string;
  answers: InspectionAnswer[];
}
