-- Fix check constraint to allow 'withdrawn' status (used by simulation withdrawal)
ALTER TABLE public.user_progress DROP CONSTRAINT user_progress_status_check;
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_status_check CHECK (status = ANY (ARRAY['locked', 'open', 'completed', 'withdrawn']));