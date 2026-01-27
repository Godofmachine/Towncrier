-- Check current user roles
SELECT id, email, role FROM profiles;

-- Update your user to admin role (replace YOUR_EMAIL with your actual email)
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';

-- Or make yourself a superadmin
-- UPDATE profiles SET role = 'superadmin' WHERE email = 'YOUR_EMAIL';
