-- Migration: Add English-translated transcript column to call_logs
-- Supports the multilingual voice calls PRD: V2 requires storing both the
-- original-language transcript (source of truth, in `transcript`) and an
-- English translation for liaison review (in `transcript_english`).
-- Run this in your Supabase SQL Editor.

ALTER TABLE public.call_logs
ADD COLUMN IF NOT EXISTS transcript_english text;

COMMENT ON COLUMN public.call_logs.transcript IS 'Original-language transcript of the resident''s response — source of truth for accuracy proofing.';
COMMENT ON COLUMN public.call_logs.transcript_english IS 'English translation of transcript, for liaison review when the original is in a non-English language. NULL if original is already English or translation has not run yet.';
