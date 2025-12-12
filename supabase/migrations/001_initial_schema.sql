-- MigrAlert Database Schema
-- Enable PostGIS extension for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================
-- ENUM TYPES
-- =====================

CREATE TYPE activity_type AS ENUM ('checkpoint', 'raid', 'patrol', 'detention', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'verified', 'removed');
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE language AS ENUM ('en', 'es');
CREATE TYPE interaction_type AS ENUM ('confirm', 'no_longer_active', 'false');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted');

-- =====================
-- TABLES
-- =====================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    preferred_language language DEFAULT 'en',
    role user_role DEFAULT 'user',
    moderator_regions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table with PostGIS geography
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    activity_type activity_type NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    confidence_score INTEGER DEFAULT 50,
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '12 hours'),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT,
    contact_order INTEGER NOT NULL CHECK (contact_order >= 1 AND contact_order <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, contact_order)
);

-- Alert configuration
CREATE TABLE alert_config (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    share_location BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report interactions (confirmations, disputes)
CREATE TABLE report_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    interaction_type interaction_type NOT NULL,
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate interactions from same user/IP
    UNIQUE (report_id, user_id),
    UNIQUE (report_id, ip_hash)
);

-- User connections (for in-app alerts)
CREATE TABLE user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, connected_user_id),
    CHECK (user_id != connected_user_id)
);

-- =====================
-- INDEXES
-- =====================

-- Spatial index for location queries
CREATE INDEX idx_reports_location ON reports USING GIST (location);

-- Index for filtering active reports
CREATE INDEX idx_reports_status_expires ON reports (status, expires_at) WHERE status != 'removed';

-- Index for moderator queries by region
CREATE INDEX idx_reports_region_status ON reports (region, status);

-- Index for user's emergency contacts
CREATE INDEX idx_emergency_contacts_user ON emergency_contacts (user_id);

-- Index for report interactions
CREATE INDEX idx_report_interactions_report ON report_interactions (report_id);

-- Index for user connections
CREATE INDEX idx_user_connections_user ON user_connections (user_id);
CREATE INDEX idx_user_connections_connected ON user_connections (connected_user_id);

-- =====================
-- FUNCTIONS
-- =====================

-- Function to get reports within a radius (in miles)
CREATE OR REPLACE FUNCTION reports_within_radius(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_miles DOUBLE PRECISION
)
RETURNS TABLE (
    id UUID,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    city TEXT,
    region TEXT,
    activity_type activity_type,
    description TEXT,
    image_url TEXT,
    status report_status,
    confidence_score INTEGER,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    distance_miles DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        r.id,
        ST_Y(r.location::geometry) as latitude,
        ST_X(r.location::geometry) as longitude,
        r.city,
        r.region,
        r.activity_type,
        r.description,
        r.image_url,
        r.status,
        r.confidence_score,
        r.created_at,
        r.expires_at,
        ST_Distance(
            r.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) / 1609.344 as distance_miles
    FROM reports r
    WHERE
        r.status != 'removed'
        AND r.expires_at > NOW()
        AND ST_DWithin(
            r.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_miles * 1609.344 -- Convert miles to meters
        )
    ORDER BY distance_miles;
$$;

-- Function to update confidence score based on interactions
CREATE OR REPLACE FUNCTION update_report_confidence()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
DECLARE
    confirm_count INTEGER;
    inactive_count INTEGER;
    false_count INTEGER;
    new_score INTEGER;
BEGIN
    -- Count interactions for this report
    SELECT
        COUNT(*) FILTER (WHERE interaction_type = 'confirm'),
        COUNT(*) FILTER (WHERE interaction_type = 'no_longer_active'),
        COUNT(*) FILTER (WHERE interaction_type = 'false')
    INTO confirm_count, inactive_count, false_count
    FROM report_interactions
    WHERE report_id = NEW.report_id;

    -- Calculate new score (base 50 for verified, adjust based on interactions)
    SELECT confidence_score INTO new_score FROM reports WHERE id = NEW.report_id;

    -- Adjust based on interaction type
    IF NEW.interaction_type = 'confirm' THEN
        new_score := LEAST(100, new_score + 10); -- Cap at 100, +10 per confirm (max +30)
    ELSIF NEW.interaction_type = 'no_longer_active' THEN
        new_score := new_score - 15;
    ELSIF NEW.interaction_type = 'false' THEN
        new_score := new_score - 25;
    END IF;

    -- Update report or remove if score too low
    IF new_score < 20 THEN
        UPDATE reports SET status = 'removed', updated_at = NOW() WHERE id = NEW.report_id;
    ELSE
        UPDATE reports SET confidence_score = new_score, updated_at = NOW() WHERE id = NEW.report_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger to update confidence on new interaction
CREATE TRIGGER on_report_interaction
    AFTER INSERT ON report_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_report_confidence();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, preferred_language)
    VALUES (NEW.id, 'en');
    RETURN NEW;
END;
$$;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_alert_config_updated_at
    BEFORE UPDATE ON alert_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Reports policies (viewable by everyone, but write requires context)
CREATE POLICY "Anyone can view active reports"
    ON reports FOR SELECT
    USING (status != 'removed' AND expires_at > NOW());

CREATE POLICY "Authenticated users can create reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR reporter_id IS NULL);

CREATE POLICY "Moderators can update reports in their region"
    ON reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND (role = 'moderator' OR role = 'admin')
            AND (moderator_regions IS NULL OR region = ANY(moderator_regions))
        )
    );

-- Emergency contacts policies
CREATE POLICY "Users can manage own contacts"
    ON emergency_contacts FOR ALL
    USING (auth.uid() = user_id);

-- Alert config policies
CREATE POLICY "Users can manage own alert config"
    ON alert_config FOR ALL
    USING (auth.uid() = user_id);

-- Report interactions policies
CREATE POLICY "Anyone can view interactions"
    ON report_interactions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create interactions"
    ON report_interactions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NULL);

-- User connections policies
CREATE POLICY "Users can view own connections"
    ON user_connections FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connection requests"
    ON user_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update connections they're part of"
    ON user_connections FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- =====================
-- STORAGE BUCKETS
-- =====================

-- Note: Run these in Supabase dashboard or via management API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('report-images', 'report-images', true);

-- Storage policy for report images
-- CREATE POLICY "Anyone can view report images"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'report-images');

-- CREATE POLICY "Authenticated users can upload report images"
--     ON storage.objects FOR INSERT
--     WITH CHECK (bucket_id = 'report-images' AND auth.role() = 'authenticated');
