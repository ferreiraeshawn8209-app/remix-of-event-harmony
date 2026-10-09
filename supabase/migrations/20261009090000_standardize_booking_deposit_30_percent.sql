-- Apply the 30% standard to future quotes without modifying any existing quotes.
UPDATE public.service_settings
SET setting_value = 30,
    description = 'Standard 30% booking deposit; cancellation charges subject to applicable consumer law',
    updated_at = now()
WHERE setting_key = 'deposit_percent';

INSERT INTO public.service_settings (setting_key, setting_value, label, description)
SELECT 'deposit_percent', 30, 'Deposit Percentage', 'Standard 30% booking deposit; cancellation charges subject to applicable consumer law'
WHERE NOT EXISTS (SELECT 1 FROM public.service_settings WHERE setting_key = 'deposit_percent');
