-- Migration: Allow public newsletter subscriptions
-- Description: Updates newsletter_subscribers to allow nullable user_id and adds name fields.

-- 1. Make user_id nullable
ALTER TABLE public.newsletter_subscribers 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add first_name and last_name
ALTER TABLE public.newsletter_subscribers 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- 3. Add unique constraint on email (since user_id is no longer the sole unique identifier or required)
ALTER TABLE public.newsletter_subscribers 
ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);

-- 4. Update RLS policies
-- Allow anyone to insert (upsert)
CREATE POLICY "Public can subscribe" ON public.newsletter_subscribers
FOR INSERT 
WITH CHECK (true);

-- Allow public to update their own subscription IF they match the email (this is tricky without auth, usually we only allow insert/upsert)
-- For now, let's just allow INSERT. If they try to subscribe again with same email, the upsert logic in API will handle it via service role or we rely on the UNIQUE constraint and let the API handle the update via admin/service role client if needed, OR we trust the policy.
-- Actually, for public forms, usually we just INSERT. If conflict, we might need a way to update. 
-- But standard Supabase Client from anon key can only INSERT if policy allows.
-- If we want "Upsert", we need UPDATE permissions too? Or is INSERT enough for "ON CONFLICT DO UPDATE"?
-- It usually requires UPDATE permission if the row exists.
-- But we can't really secure "UPDATE" by email for anonymous users easily (anyone could overwrite anyone's sub status by guessing email).
-- SO: Secure approach: Public only INSERTS. If exists, API handles it (maybe via Service Role to update if valid).
-- Or, we just say "Already subscribed".
-- Let's stick to simple INSERT policy for anon.
-- The API route uses `createClient` from `@/lib/supabase/server`. If that uses cookie auth, it's user scope. If it's anon, it's anon scope.

-- Let's ensure the API uses Service Role if operating on behalf of a public user to ENSURE we can upsert without exposing RLS security holes? 
-- OR, just allow insert for now.

-- NOTE: existing policies rely on `auth.uid() = user_id`.
-- We need a policy for anonymous insertion.
