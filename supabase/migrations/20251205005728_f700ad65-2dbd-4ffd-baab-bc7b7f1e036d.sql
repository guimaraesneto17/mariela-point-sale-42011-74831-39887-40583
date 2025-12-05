-- Drop the existing restrictive policy and create a permissive one
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a PERMISSIVE SELECT policy for users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Note: The admin policy remains as RESTRICTIVE which is appropriate for admin-level access