import type { PageParams } from '../api';

export interface ListInspectionsParams extends PageParams {
  /** Exact match. */
  workOrder?: string;
  projectId?: string;
  templateId?: string;
  inspectorId?: string;
  /** ISO date-time with offset: filledAt >= from. */
  from?: string;
  /** ISO date-time with offset: filledAt <= to. */
  to?: string;
}
