-- ============================================================
-- Jeany's Olshoppe Rider App — Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Deliveries Table (NEW)
CREATE TABLE IF NOT EXISTS public.deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id        UUID REFERENCES auth.users(id),
  customer_name   TEXT NOT NULL,
  customer_email  TEXT,
  address         TEXT NOT NULL,
  landmark        TEXT,
  notes           TEXT,
  order_summary   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered')),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Riders can read only their own deliveries
CREATE POLICY "riders_read_own_deliveries" ON public.deliveries
  FOR SELECT USING (rider_id = auth.uid());

-- Riders can update only status, started_at, delivered_at on their own deliveries
CREATE POLICY "riders_update_own_delivery_status" ON public.deliveries
  FOR UPDATE USING (rider_id = auth.uid())
  WITH CHECK (rider_id = auth.uid());

-- Admins can do everything on deliveries
CREATE POLICY "admins_manage_deliveries" ON public.deliveries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 2. Extend people table with rider-specific columns
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;


-- 3. Ensure rider_statuses table exists
CREATE TABLE IF NOT EXISTS public.rider_statuses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id        UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  latitude        DECIMAL(10, 8) NOT NULL DEFAULT 0,
  longitude       DECIMAL(11, 8) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'offline',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rider_statuses ENABLE ROW LEVEL SECURITY;

-- Riders upsert only their own row
CREATE POLICY "riders_upsert_own_location" ON public.rider_statuses
  FOR ALL USING (rider_id = auth.uid())
  WITH CHECK (rider_id = auth.uid());

-- Admins can read all rider locations
CREATE POLICY "admins_read_all_locations" ON public.rider_statuses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );


-- 4. Ensure chats table exists (for rider<->admin messaging)
CREATE TABLE IF NOT EXISTS public.chats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  rider_id        UUID REFERENCES auth.users(id) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_chats" ON public.chats
  FOR SELECT USING (user_id = auth.uid() OR rider_id = auth.uid());

CREATE POLICY "users_create_chats" ON public.chats
  FOR INSERT WITH CHECK (user_id = auth.uid() OR rider_id = auth.uid());


-- 5. Ensure messages table exists
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id         UUID REFERENCES public.chats(id) NOT NULL,
  sender_id       UUID REFERENCES auth.users(id) NOT NULL,
  message         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_participants_read_messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE id = chat_id
        AND (user_id = auth.uid() OR rider_id = auth.uid())
    )
  );

CREATE POLICY "chat_participants_send_messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE id = chat_id
        AND (user_id = auth.uid() OR rider_id = auth.uid())
    )
  );

-- 6. Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_statuses;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
