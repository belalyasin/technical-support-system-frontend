export type RoleName = 'user' | 'admin' | 'super admin';

export const STAFF_ROLES: RoleName[] = ['admin', 'super admin'];

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  roles?: string[];
}

export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface PersonRef {
  id: number;
  name: string | null;
}

export interface ChatMessage {
  id: number;
  body: string;
  user: PersonRef;
  is_mine: boolean;
  created_at: string;
}

export interface Conversation {
  uuid: string;
  name: string | null;
  user: PersonRef;
  participants?: (PersonRef & { read_at: string | null })[];
  latest_message?: ChatMessage | null;
  unread_count?: number;
  last_message_at: string | null;
  created_at: string;
}

export interface DefaultMessage {
  id: number;
  body: string;
  parent_name: string;
  // The API sends ' - ' when the message has no parent
  parent_id: number | string;
  user_id: number | string;
  created_at: string;
  updated_at: string;
}

export interface UserPayload {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}

/** Message the API sent with an error response, or a fallback. */
export function apiErrorMessage(error: any, fallback = 'Something went wrong. Please try again.'): string {
  if (error?.status === 0) {
    return 'Cannot reach the server. Check that the API is running.';
  }
  const body = error?.error;
  if (body && typeof body === 'object') {
    if (body.errors && typeof body.errors === 'object') {
      const first = Object.values(body.errors)[0] as any;
      if (Array.isArray(first) && first.length) {
        return String(first[0]);
      }
    }
    if (typeof body.message === 'string' && body.message) {
      return body.message;
    }
  }
  return fallback;
}
