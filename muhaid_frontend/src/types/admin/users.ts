import type {
  CalendarDate,
  IsoDateTime,
  PageParams,
  ProjectRef,
  Role,
} from '../api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: IsoDateTime;
}

export interface UserTemplate {
  id: string;
  name: string;
  validFrom: CalendarDate;
  validTo: CalendarDate | null;
  project: ProjectRef;
  assignedAt: IsoDateTime;
}

export interface UserDetail extends User {
  templates: UserTemplate[];
}

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role?: Role; // default 'inspector'
}

/** Send only what changed. The email can never be changed. */
export type UpdateUserBody = Partial<
  Pick<User, 'name' | 'role' | 'isActive'>
> & {
  password?: string;
};

export interface ListUsersParams extends PageParams {
  role?: Role;
  isActive?: boolean;
}
