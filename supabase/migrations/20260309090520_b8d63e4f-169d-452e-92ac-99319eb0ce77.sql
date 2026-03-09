-- Create function to notify admin when event plan is submitted
CREATE OR REPLACE FUNCTION public.notify_admin_on_event_plan_submitted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, quote_id, email)
  VALUES (
    'event_plan_submitted',
    'Event Plan Submitted',
    NEW.client_name || ' submitted event plan' || 
      CASE WHEN NEW.event_date IS NOT NULL THEN ' for ' || NEW.event_date::text ELSE '' END ||
      CASE WHEN NEW.venue IS NOT NULL THEN ' at ' || NEW.venue ELSE '' END,
    NEW.quote_id,
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- Create trigger on event_plans table
CREATE TRIGGER on_event_plan_submitted
  AFTER INSERT ON public.event_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_event_plan_submitted();