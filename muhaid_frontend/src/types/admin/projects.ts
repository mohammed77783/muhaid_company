import type { CalendarDate, IsoDateTime, PageParams } from '../api';

export interface Project {
  id: string;
  code: string;
  name: string;
  createdAt: IsoDateTime;
}

export interface ProjectDetail extends Project {
  templates: {
    id: string;
    name: string;
    validFrom: CalendarDate;
    validTo: CalendarDate | null;
  }[];
}

export interface ProjectBody {
  code: string;
  name: string;
}

export type ListProjectsParams = PageParams; // only page and limit
