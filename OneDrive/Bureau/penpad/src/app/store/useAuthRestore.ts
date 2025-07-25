import { useEffect } from 'react';
import { useUserStore } from './useUserStore';

export function useAuthRestore(setLoading?: (loading: boolean) => void) {
  const setUser = useUserStore((state) => state.setUser);
  const logout = useUserStore((state) => state.logout);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (e) {
        logout();
      } finally {
        if (setLoading) setLoading(false);
      }
    }
    fetchUser();
    // Only run on mount
    // eslint-disable-next-line
  }, []);
} 