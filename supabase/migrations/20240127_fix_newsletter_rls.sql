-- FIX: Add INSERT policy for newsletter_subscribers
-- The previous migration only added SELECT and UPDATE, causing 'upsert' (insert) to fail.

CREATE POLICY "Users can insert own subscription" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Optional: Ensure Notifications also has insert if we ever need it from client (though triggers handle it usually)
-- For now, just fixing the reported error.
