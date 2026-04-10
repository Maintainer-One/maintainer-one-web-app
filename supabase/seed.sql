-- Seed data for local development
INSERT INTO public.alpha_keys (key_string)
VALUES 
  ('ALPHA-KEY-001'),
  ('ALPHA-KEY-002'),
  ('ALPHA-KEY-003'),
  ('M1-FOUNDER-BETA');

-- Leagues
INSERT INTO public.leagues (name)
VALUES ('Maintainer One')
ON CONFLICT (name) DO NOTHING;

-- Seasons
INSERT INTO public.seasons (league_id, name, status)
SELECT id, 'Season 1', 'ongoing' FROM public.leagues WHERE name = 'Maintainer One';

-- Teams (4 teams for Protocol Alpha)
INSERT INTO public.teams (league_id, name, color)
SELECT id, 'Amber', '#d97706' FROM public.leagues WHERE name = 'Maintainer One'
UNION ALL
SELECT id, 'Beige', '#d4d4d8' FROM public.leagues WHERE name = 'Maintainer One'
UNION ALL
SELECT id, 'Crimson', '#dc2626' FROM public.leagues WHERE name = 'Maintainer One'
UNION ALL
SELECT id, 'Denim', '#2563eb' FROM public.leagues WHERE name = 'Maintainer One';

-- Players (3 per team)
INSERT INTO public.players (team_id, name)
SELECT id, 'Amber 1' FROM public.teams WHERE name = 'Amber'
UNION ALL
SELECT id, 'Amber 2' FROM public.teams WHERE name = 'Amber'
UNION ALL
SELECT id, 'Amber 3' FROM public.teams WHERE name = 'Amber'
UNION ALL
SELECT id, 'Beige 1' FROM public.teams WHERE name = 'Beige'
UNION ALL
SELECT id, 'Beige 2' FROM public.teams WHERE name = 'Beige'
UNION ALL
SELECT id, 'Beige 3' FROM public.teams WHERE name = 'Beige'
UNION ALL
SELECT id, 'Crimson 1' FROM public.teams WHERE name = 'Crimson'
UNION ALL
SELECT id, 'Crimson 2' FROM public.teams WHERE name = 'Crimson'
UNION ALL
SELECT id, 'Crimson 3' FROM public.teams WHERE name = 'Crimson'
UNION ALL
SELECT id, 'Denim 1' FROM public.teams WHERE name = 'Denim'
UNION ALL
SELECT id, 'Denim 2' FROM public.teams WHERE name = 'Denim'
UNION ALL
SELECT id, 'Denim 3' FROM public.teams WHERE name = 'Denim';
