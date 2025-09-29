import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProfileSync = () => {
  useEffect(() => {
    // Set up real-time subscription for profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile updated:', payload);
          // The component using this hook can listen for profile changes
          // and refresh its data accordingly
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms'
        },
        (payload) => {
          console.log('Room tenant info updated:', payload);
          // Handle room tenant info updates
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};

export default useProfileSync;