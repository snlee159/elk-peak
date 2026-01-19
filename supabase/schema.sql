-- ============================================
-- Elk Peak Consulting - Database Schema
-- ============================================
-- Run this script in your Supabase SQL Editor
-- ============================================

-- ============================================
-- Authentication Table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_password (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT true,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Quarter Goals Table
-- ============================================

CREATE TABLE IF NOT EXISTS quarter_goal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_value FLOAT NOT NULL,
  current_value FLOAT,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  year INTEGER NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('elk_peak_mrr', 'life_organizer_revenue', 'friendly_tech_revenue', 'runtime_pm_users', 'runtime_pm_mrr', 'custom')),
  "order" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Elk Peak Consulting Tables
-- ============================================

CREATE TABLE IF NOT EXISTS elk_peak_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  monthly_revenue FLOAT DEFAULT 0,
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elk_peak_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES elk_peak_clients(id),
  revenue FLOAT DEFAULT 0,
  status TEXT DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Life Organizer Guru Tables
-- ============================================

CREATE TABLE IF NOT EXISTS life_organizer_kdp_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  units INTEGER DEFAULT 0,
  revenue FLOAT DEFAULT 0,
  product_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS life_organizer_notion_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  units INTEGER DEFAULT 0,
  revenue FLOAT DEFAULT 0,
  product_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- The Friendly Tech Help Tables
-- ============================================

CREATE TABLE IF NOT EXISTS friendly_tech_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  hoa_client_id UUID,
  revenue FLOAT DEFAULT 0,
  hours INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friendly_tech_hoa_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Runtime PM Tables
-- ============================================

CREATE TABLE IF NOT EXISTS runtime_pm_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  signup_date DATE NOT NULL,
  last_active_date DATE,
  subscription_tier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS runtime_pm_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES runtime_pm_users(id),
  status TEXT NOT NULL DEFAULT 'active',
  monthly_amount FLOAT DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Business Metrics Overrides Table
-- ============================================
-- Stores manual overrides for calculated metrics

CREATE TABLE IF NOT EXISTS business_metrics_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  value FLOAT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  UNIQUE(company, metric_key)
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quarter_goal_quarter_year ON quarter_goal(quarter, year);
CREATE INDEX IF NOT EXISTS idx_elk_peak_clients_status ON elk_peak_clients(status);
CREATE INDEX IF NOT EXISTS idx_elk_peak_projects_status ON elk_peak_projects(status);
CREATE INDEX IF NOT EXISTS idx_kdp_sales_date ON life_organizer_kdp_sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_notion_sales_date ON life_organizer_notion_sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_friendly_tech_days_date ON friendly_tech_days(date DESC);
CREATE INDEX IF NOT EXISTS idx_friendly_tech_hoa_status ON friendly_tech_hoa_clients(status);
CREATE INDEX IF NOT EXISTS idx_runtime_pm_users_status ON runtime_pm_users(status);
CREATE INDEX IF NOT EXISTS idx_runtime_pm_subscriptions_status ON runtime_pm_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_business_metrics_overrides_company ON business_metrics_overrides(company, metric_key);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE admin_password ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarter_goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE elk_peak_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE elk_peak_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_organizer_kdp_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_organizer_notion_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendly_tech_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendly_tech_hoa_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_pm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_pm_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics_overrides ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies (Development)
-- ============================================
-- WARNING: These policies allow all operations.
-- In production, replace with proper authentication checks.

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON admin_password;
DROP POLICY IF EXISTS "Allow all for authenticated" ON quarter_goal;
DROP POLICY IF EXISTS "Allow all for authenticated" ON elk_peak_clients;
DROP POLICY IF EXISTS "Allow all for authenticated" ON elk_peak_projects;
DROP POLICY IF EXISTS "Allow all for authenticated" ON life_organizer_kdp_sales;
DROP POLICY IF EXISTS "Allow all for authenticated" ON life_organizer_notion_sales;
DROP POLICY IF EXISTS "Allow all for authenticated" ON friendly_tech_days;
DROP POLICY IF EXISTS "Allow all for authenticated" ON friendly_tech_hoa_clients;
DROP POLICY IF EXISTS "Allow all for authenticated" ON runtime_pm_users;
DROP POLICY IF EXISTS "Allow all for authenticated" ON runtime_pm_subscriptions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON business_metrics_overrides;

-- Read-only policies for all tables (writes go through admin-write edge function)
CREATE POLICY "Allow read for all" ON admin_password FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON quarter_goal FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON elk_peak_clients FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON elk_peak_projects FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON life_organizer_kdp_sales FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON life_organizer_notion_sales FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON friendly_tech_days FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON friendly_tech_hoa_clients FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON runtime_pm_users FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON runtime_pm_subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON business_metrics_overrides FOR SELECT USING (true);

-- Note: Write operations (INSERT, UPDATE, DELETE) are handled by the admin-write edge function
-- which validates admin credentials and domain restrictions before allowing writes

-- ============================================
-- Sample Data (Optional)
-- ============================================
-- Uncomment to insert test data:

-- INSERT INTO admin_password (password, is_admin, name)
-- VALUES ('your_password_here', true, 'Admin User');
