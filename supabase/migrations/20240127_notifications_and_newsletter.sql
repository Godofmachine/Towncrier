-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NEWSLETTER SUBSCRIBERS
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'subscribed', -- subscribed, unsubscribed
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Newsletter policies (Admin can view all, User can view own)
-- For now, simple user policy:
CREATE POLICY "Users can view own subscription" ON newsletter_subscribers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON newsletter_subscribers FOR UPDATE USING (auth.uid() = user_id);
-- (Admin policies would be handled by Service Role key usually, so explicit admin policy optional if using admin client)

-- TRIGGER: Welcome Notification
CREATE OR REPLACE FUNCTION public.handle_new_user_notification() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    new.id, 
    'success', 
    'Welcome to Towncrier!', 
    'Your account has been successfully created. Connect your Gmail to start sending.'
  );
  
  -- Auto-subscribe to newsletter? (Optional, let's do it for growth, user can opt-out)
  INSERT INTO public.newsletter_subscribers (user_id, email, status)
  VALUES (new.id, new.email, 'subscribed');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_notification
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_notification();

-- TRIGGER: Gmail Connected Notification (Admin Alert / User Success)
CREATE OR REPLACE FUNCTION public.handle_gmail_connected() 
RETURNS TRIGGER AS $$
BEGIN
  -- Notify User
  IF (old.gmail_connected = false AND new.gmail_connected = true) THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      new.id, 
      'success', 
      'Gmail Connected', 
      'You are now ready to send campaigns directly from your authorized Gmail account.'
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update_notify
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_gmail_connected();
