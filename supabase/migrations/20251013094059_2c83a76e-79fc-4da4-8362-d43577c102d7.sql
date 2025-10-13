-- Enable pg_net extension for making HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to send SMS notification via edge function
CREATE OR REPLACE FUNCTION public.notify_sms_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  function_url text;
BEGIN
  -- Construct the edge function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-sms-notification';
  
  -- If setting doesn't exist, use the project-specific URL
  IF function_url IS NULL OR function_url = '' THEN
    function_url := 'https://ubqnwfkzshalroypoucb.supabase.co/functions/v1/send-sms-notification';
  END IF;

  -- Make async HTTP request to edge function
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'message_id', NEW.id::text,
      'sender_id', NEW.sender_id::text,
      'receiver_id', NEW.receiver_id::text,
      'content', NEW.content,
      'created_at', NEW.created_at::text
    )
  ) INTO request_id;

  -- Log the request
  RAISE LOG 'SMS notification request sent for message %, request_id: %', NEW.id, request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send SMS notification for message %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS on_message_created_send_sms ON public.messages;
CREATE TRIGGER on_message_created_send_sms
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_sms_on_message();