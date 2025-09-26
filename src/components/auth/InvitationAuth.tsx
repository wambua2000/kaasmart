import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useInvitationAuth = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Handle invitation-based signup
    const handleInvitationSignup = async (email: string, temporaryPassword: string) => {
      try {
        // First, check if there's a valid invitation by calling the function directly
        const { data: invitationData, error: invitationError } = await supabase
          .from('invitations')
          .select('role, property_id, room_id')
          .eq('email', email)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (invitationError || !invitationData) {
          throw new Error('No valid invitation found');
        }

        // Sign up the user with the temporary password
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: temporaryPassword,
          options: {
            data: {
              role: invitationData.role,
              invited: true,
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData.user) {
          toast({
            title: "Account Created",
            description: "Your account has been created successfully. You can now sign in.",
          });
        }

      } catch (error: any) {
        toast({
          title: "Signup Failed", 
          description: error.message,
          variant: "destructive",
        });
      }
    };

    // Check for invitation parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const invitationEmail = urlParams.get('email');
    const temporaryPassword = urlParams.get('temp_password');

    if (invitationEmail && temporaryPassword) {
      handleInvitationSignup(invitationEmail, temporaryPassword);
      
      // Clean up URL parameters
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

  }, [toast]);
};