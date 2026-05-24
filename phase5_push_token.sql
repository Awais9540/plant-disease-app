-- Run this in the Supabase SQL Editor to support Phase 5 Push Notifications
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
