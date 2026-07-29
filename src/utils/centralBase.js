import { useAuth } from '../context/AuthContext';

/**
 * Central Segment pages (Book Sharing / Job Query) render in two shells:
 * inside the student/teacher dashboard layouts for logged-in users, and in the
 * bare PublicLayout for logged-out visitors. Internal links must stay within
 * whichever shell the viewer is in — this hook returns the path prefix that
 * makes that true ('' for the public shell).
 */
export const useCentralBase = () => {
  const { user } = useAuth();
  if (user?.role === 'student') return '/student';
  if (user?.role === 'teacher') return '/teacher';
  return '';
};
