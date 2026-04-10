-- Initial Protocol Alpha schema for Maintainer One

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: alpha_keys
CREATE TABLE public.alpha_keys (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  key_string text UNIQUE NOT NULL,
  is_used boolean DEFAULT false NOT NULL,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  claimed_at timestamp with time zone
);

ALTER TABLE public.alpha_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alpha keys are viewable by everyone" ON public.alpha_keys FOR SELECT USING (true);
CREATE POLICY "Users can claim alpha keys" ON public.alpha_keys FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table: leagues
CREATE TABLE public.leagues (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leagues are viewable by everyone" ON public.leagues FOR SELECT USING (true);

-- Insert Maintainer One default league
INSERT INTO public.leagues (name) VALUES ('Maintainer One');

-- Table: seasons
CREATE TABLE public.seasons (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE,
  season_number integer NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(league_id, season_number)
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seasons are viewable by everyone" ON public.seasons FOR SELECT USING (true);

-- Table: teams
CREATE TABLE public.teams (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE,
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Owners can update their teams" ON public.teams FOR UPDATE USING (auth.uid() = owner_id);

-- Table: players
CREATE TABLE public.players (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players are viewable by everyone" ON public.players FOR SELECT USING (true);

-- Table: games
CREATE TABLE public.games (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  season_id uuid REFERENCES public.seasons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'ongoing', 'completed'
  home_team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  played_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (true);

-- Table: game_recaps
CREATE TABLE public.game_recaps (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  control_percent numeric(5,2) NOT NULL DEFAULT 0,
  captures integer NOT NULL DEFAULT 0,
  fortune numeric(5,2) NOT NULL DEFAULT 0,
  expected_captures integer NOT NULL DEFAULT 0,
  contested_captures integer NOT NULL DEFAULT 0,
  stolen_captures integer NOT NULL DEFAULT 0,
  despawns integer NOT NULL DEFAULT 0,
  distance_traveled numeric(10,2) NOT NULL DEFAULT 0,
  capture_efficiency numeric(5,2) NOT NULL DEFAULT 0,
  time_in_advantage integer NOT NULL DEFAULT 0,
  denials_clutches integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(game_id, team_id)
);

ALTER TABLE public.game_recaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Game recaps are viewable by everyone" ON public.game_recaps FOR SELECT USING (true);

-- End of schema
