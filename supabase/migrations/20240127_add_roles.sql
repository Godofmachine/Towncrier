-- Add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'));

-- Set initial superadmin
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'samueladeniran016@gmail.com';

-- Update RLS Policies for Profiles

-- Allow admins and superadmins to view all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile OR admins can view all" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Allow superadmins to update any profile (to change roles)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile OR superadmins can update all" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);
