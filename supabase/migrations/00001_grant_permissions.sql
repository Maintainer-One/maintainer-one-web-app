-- Explicitly grant access to anon and authenticated roles for Alpha Key verification
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.alpha_keys TO anon, authenticated;
GRANT ALL ON public.alpha_keys TO service_role;
