-- FIX: Avoid infinite recursion in RLS policies

-- 1. Create a helper function to access role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update SELECT Policy
DROP POLICY IF EXISTS "Users can view own profile OR admins can view all" ON public.profiles;
CREATE POLICY "Users can view own profile OR admins can view all" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR 
  (public.get_my_role() IN ('admin', 'superadmin'))
);

-- 3. Update UPDATE Policy
DROP POLICY IF EXISTS "Users can update own profile OR superadmins can update all" ON public.profiles;
CREATE POLICY "Users can update own profile OR superadmins can update all" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR 
  (public.get_my_role() = 'superadmin')
);
