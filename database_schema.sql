-- ==============================================================================
-- LEAFDOC PRODUCTION SUPABASE SCHEMA
-- Run this entire script in the Supabase SQL Editor (SQL Editor -> New query)
-- ==============================================================================

-- 1. Create Users Table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  crop_interests TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on Row Level Security (RLS) for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- User Policies: 
-- Anyone authenticated can view user profiles (needed for community features)
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
-- Note: Insert is handled by a trigger (see below)

-- 2. Trigger to automatically create a user profile when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Create Scans Table (History Module)
CREATE TABLE public.scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT,
  gradcam_url TEXT,
  crop_name TEXT NOT NULL,
  disease_name TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  treatment_summary TEXT,
  is_healthy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
-- Users can only see and insert their own scans
CREATE POLICY "Users can view own scans" ON public.scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scans" ON public.scans FOR DELETE USING (auth.uid() = user_id);

-- 4. Create Community Posts Table
CREATE TABLE public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
-- Anyone authenticated can read posts
CREATE POLICY "Posts are viewable by everyone" ON public.community_posts FOR SELECT USING (auth.role() = 'authenticated');
-- Users can insert and delete their own posts
CREATE POLICY "Users can insert own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = author_id);

-- 5. Create Comments Table
CREATE TABLE public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON public.post_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = author_id);

-- 6. Create Likes Table
CREATE TABLE public.post_likes (
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can toggle own likes" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- 7. Setup Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('scans', 'scans', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('community', 'community', true) ON CONFLICT DO NOTHING;

-- Open Storage Policies (In production you'd restrict these, but for fast iteration we'll allow authenticated uploads)
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Scan images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'scans');
CREATE POLICY "Anyone can upload a scan." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scans' AND auth.role() = 'authenticated');

CREATE POLICY "Community images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'community');
CREATE POLICY "Anyone can upload to community." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'community' AND auth.role() = 'authenticated');
