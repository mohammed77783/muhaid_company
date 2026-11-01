import type {
  CalendarDate,
  IsoDateTime,
  PageParams,
  ProjectRef,
  TemplateItem,
} from '../api';

export interface TemplateSummary {
  id: string;
  name: string;
  validFrom: CalendarDate;
  validTo: CalendarDate | null;
  createdAt: IsoDateTime;
  project: ProjectRef;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  /** The work order created by this assignment. */
  workOrderNumber: string;
  /** Set when the inspector submitted it: a one-time job. */
  completedAt: IsoDateTime | null;
  assignedAt: IsoDateTime;
}

export interface TemplateDetail extends TemplateSummary {
  /** Sorted by position. */
  items: TemplateItem[];
  /** Sorted by name. */
  assignees: Assignee[];
  /** Above 0, the items can no longer be replaced. */
  inspectionCount: number;
}

export interface CreateTemplateBody {
  projectId: string;
  name: string;
  validFrom: CalendarDate;
  validTo?: CalendarDate | null;
  /** Question texts. Array order is position: the first entry gets position 1. */
  items: string[];
}

/** The project can't change after creation. */
export type UpdateTemplateBody = Partial<Omit<CreateTemplateBody, 'projectId'>>;

export interface ListTemplatesParams extends PageParams {
  projectId?: string;
}
