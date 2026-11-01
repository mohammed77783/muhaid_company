import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

export type Pagination = Pick<PaginationDto, 'page' | 'limit'>;

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export const offsetOf = ({ page, limit }: Pagination) => (page - 1) * limit;
