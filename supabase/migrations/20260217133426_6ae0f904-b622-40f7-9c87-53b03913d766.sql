
-- Allow school admins to read their own school's activation codes
CREATE POLICY "School admins can read own school codes"
ON public.school_codes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.school_admins sa
    JOIN public.school_orders so ON so.school_id = sa.school_id
    WHERE sa.user_id = auth.uid()
    AND so.id = school_codes.school_order_id
  )
);

-- Allow school admins to read their own school's orders
CREATE POLICY "School admins can read own school orders"
ON public.school_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.school_admins sa
    WHERE sa.user_id = auth.uid()
    AND sa.school_id = school_orders.school_id
  )
);

-- Allow school admins to read their own school
CREATE POLICY "School admins can read own school"
ON public.schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.school_admins sa
    WHERE sa.user_id = auth.uid()
    AND sa.school_id = schools.id
  )
);
