-- TradeFlow Supabase Schema
-- Run this in your Supabase SQL Editor to create the necessary tables.

-- 1. DROP existing tables to ensure a fresh, consistent schema
DROP TABLE IF EXISTS tf_documents CASCADE;
DROP TABLE IF EXISTS tf_settings CASCADE;
DROP TABLE IF EXISTS tf_activity_logs CASCADE;
DROP TABLE IF EXISTS tf_transactions CASCADE;
DROP TABLE IF EXISTS tf_expenses CASCADE;
DROP TABLE IF EXISTS tf_customers CASCADE;
DROP TABLE IF EXISTS tf_products CASCADE;

-- 2. Products table
CREATE TABLE tf_products (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  hs_code TEXT,
  cost_price DECIMAL(12, 2),
  sell_price DECIMAL(12, 2),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  barcode TEXT,
  sku TEXT,
  image TEXT,
  unit TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Customers table
CREATE TABLE tf_customers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  membership_tier TEXT DEFAULT 'Bronze',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Expenses table
CREATE TABLE tf_expenses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT
);

-- 5. Transactions table
CREATE TABLE tf_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'sale' or 'purchase'
  product_id TEXT,
  product_name TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_id TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'completed',
  currency TEXT,
  vat_percent DECIMAL(5, 2),
  vat_amount DECIMAL(12, 2),
  items JSONB,
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_points_used INTEGER DEFAULT 0,
  shipping_cost DECIMAL(12, 2),
  customs_duty DECIMAL(12, 2),
  vat DECIMAL(12, 2),
  other_cost DECIMAL(12, 2),
  sell_price DECIMAL(12, 2),
  supplier TEXT,
  payment_method TEXT,
  exchange_rate DECIMAL(12, 4),
  expiry_date DATE
);

-- 6. Activity Logs table
CREATE TABLE tf_activity_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. App Settings table (Stated by user ID)
CREATE TABLE tf_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL
);

-- 8. Documents table
CREATE TABLE tf_documents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  ref TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  size TEXT,
  file_data TEXT, -- In a real app, use Supabase Storage for this
  file_type TEXT
);

-- 9. Row Level Security (RLS) Policies
-- These are required for security in Supabase.

ALTER TABLE tf_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own products" ON "public"."tf_products";
CREATE POLICY "Users can manage their own products" ON "public"."tf_products" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE tf_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own customers" ON "public"."tf_customers";
CREATE POLICY "Users can manage their own customers" ON "public"."tf_customers" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE tf_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON "public"."tf_expenses";
CREATE POLICY "Users can manage their own expenses" ON "public"."tf_expenses" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE tf_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON "public"."tf_transactions";
CREATE POLICY "Users can manage their own transactions" ON "public"."tf_transactions" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE tf_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own settings" ON "public"."tf_settings";
CREATE POLICY "Users can manage their own settings" ON "public"."tf_settings" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE tf_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own activity logs" ON "public"."tf_activity_logs";
CREATE POLICY "Users can manage their own activity logs" ON "public"."tf_activity_logs" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE tf_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own documents" ON "public"."tf_documents";
CREATE POLICY "Users can manage their own documents" ON "public"."tf_documents" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
