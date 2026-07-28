-- EarnVictor Supabase SQL Schema
-- Paste this script into your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Profiles / Users Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'publisher' CHECK (role IN ('publisher', 'owner')),
    balance_usd DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
    balance_inr DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Properties (Sites / Apps) Table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    publisher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('website', 'app', 'mini_game', 'telegram_bot', 'apk')),
    verification_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'verified', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE
);

-- 3. Zones (Ad placements generated for properties)
CREATE TABLE IF NOT EXISTS public.zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('smartlink', 'popunder', 'banner', 'video')),
    cpm_rate DECIMAL(6, 2) NOT NULL DEFAULT 1.50, -- USD per 1000 impressions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Ad Events (Logs of impressions and clicks for actual auditing)
CREATE TABLE IF NOT EXISTS public.ad_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE NOT NULL,
    publisher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    revenue_usd DECIMAL(12, 6) NOT NULL DEFAULT 0.000000,
    revenue_inr DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
    owner_commission_usd DECIMAL(12, 6) NOT NULL DEFAULT 0.000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    publisher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount_usd DECIMAL(12, 4) NOT NULL,
    amount_local DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'INR')),
    payment_method TEXT NOT NULL, -- Bank Transfer, UPI, PayPal, USDT
    account_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. System Settings
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Default Settings Insert
INSERT INTO public.settings (key, value) VALUES
('owner_commission_rate', '0.20'), -- 20% platform commission
('default_usd_to_inr', '83.50')
ON CONFLICT (key) DO NOTHING;

-- INDEXES for fast reporting
CREATE INDEX IF NOT EXISTS idx_ad_events_publisher ON public.ad_events(publisher_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_created_at ON public.ad_events(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_publisher ON public.properties(publisher_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Publisher can read/write their own data; Owner can read/write everything)
CREATE POLICY "Profiles are viewable by owner and account holder"
    ON public.profiles FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Profiles update by owner or user"
    ON public.profiles FOR UPDATE USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Properties are viewable by owner and publisher"
    ON public.properties FOR SELECT USING (auth.uid() = publisher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Properties insertable by publisher"
    ON public.properties FOR INSERT WITH CHECK (auth.uid() = publisher_id);

CREATE POLICY "Properties update by owner or publisher"
    ON public.properties FOR UPDATE USING (auth.uid() = publisher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Zones viewable by owner and publisher"
    ON public.zones FOR SELECT USING (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND (publisher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'))));

CREATE POLICY "Zones insertable by publisher"
    ON public.zones FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND publisher_id = auth.uid()));

CREATE POLICY "Ad events viewable by publisher or owner"
    ON public.ad_events FOR SELECT USING (auth.uid() = publisher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Withdrawals viewable by publisher or owner"
    ON public.withdrawals FOR SELECT USING (auth.uid() = publisher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Withdrawals insertable by publisher"
    ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = publisher_id);

CREATE POLICY "Withdrawals update by owner only"
    ON public.withdrawals FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

-- Trigger to automatically create a profile row upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, balance_usd, balance_inr)
    VALUES (new.id, new.email, 'publisher', 0.00, 0.00);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Subscriptions Table (Ads Free & Boosters)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    publisher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    utr_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for Subscriptions
CREATE POLICY "Subscriptions viewable by publisher or owner"
    ON public.subscriptions FOR SELECT USING (auth.uid() = publisher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Subscriptions insertable by publisher"
    ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = publisher_id);

CREATE POLICY "Subscriptions update by owner only"
    ON public.subscriptions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

