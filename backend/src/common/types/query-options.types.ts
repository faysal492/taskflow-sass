import { FindOptionsWhere } from 'typeorm';

type SortOrder = 'asc' | 'desc';

export interface QueryOptions<T> {
  where?: FindOptionsWhere<T>;
  relations?: string[];
  select?: (keyof T)[];
  order?: Record<string, SortOrder>;
  skip?: number;
  take?: number;
}