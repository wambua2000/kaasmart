-- Update the trigger function to use correct column names
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
  function_url := 'https://ubqnwfkzshalroypoucb.supabase.co/functions/v1/send-sms-notification';

  -- Make async HTTP request to edge function with correct column names
  SELECT extensions.http_post(
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