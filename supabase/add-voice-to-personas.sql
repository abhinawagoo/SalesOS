-- Run in Supabase SQL Editor
-- Adds voice column to personas table for per-persona TTS voice selection

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'nova';
