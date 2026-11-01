import { users } from '../Database/schema/index.js';

// Columns safe to return from the API (never password_hash).
export const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
};
