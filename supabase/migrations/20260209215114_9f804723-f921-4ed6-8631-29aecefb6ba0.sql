
-- Add unique constraint on user_progress for upsert to work
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_step_unique UNIQUE (user_id, step_id);

-- Add unique constraint on simulation_responses for upsert to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'simulation_responses_user_scenario_unique'
  ) THEN
    ALTER TABLE public.simulation_responses ADD CONSTRAINT simulation_responses_user_scenario_unique UNIQUE (user_id, scenario_id);
  END IF;
END $$;

-- Add unique constraint on answers for upsert to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'answers_user_question_unique'
  ) THEN
    ALTER TABLE public.answers ADD CONSTRAINT answers_user_question_unique UNIQUE (user_id, question_id);
  END IF;
END $$;

-- Add unique constraint on holland_results for upsert to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'holland_results_user_unique'
  ) THEN
    ALTER TABLE public.holland_results ADD CONSTRAINT holland_results_user_unique UNIQUE (user_id);
  END IF;
END $$;
