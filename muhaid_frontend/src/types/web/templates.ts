import type { CalendarDate, ProjectRef, TemplateItem } from '../api';

export interface WebTemplate {
  id: string;
  name: string;
  validFrom: CalendarDate;
  /** null: no end date. */
  validTo: CalendarDate | null;
  project: ProjectRef;
  /** The work order (أمر العمل) created when this template was assigned to the inspector. */
  workOrderNumber: string;
  /** Always null in the list: completed ones are not returned. */
  completedAt: string | null;
  /** Sorted by position. */
  items: TemplateItem[];
}
