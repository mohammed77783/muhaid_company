import { pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['admin', 'inspector']);

// نعم / لا / لا ينطبق
export const answerValue = pgEnum('answer_value', ['yes', 'no', 'na']);
