import { Inject } from '@nestjs/common';
import { DRIZZLE } from './database.constants.js';

export const InjectDb = () => Inject(DRIZZLE);
