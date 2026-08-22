-- RoutePlan India Database Schema
-- Run in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    whatsapp_business_account_id TEXT,
    gupshup_app_id TEXT,
    razorpay_account_id TEXT,
    gstin TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supabase_user_id UUID,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'driver')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    pincode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    delivery_instructions TEXT,
    tags TEXT[] DEFAULT '{}',
    gstin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'auto', 'van', 'truck')),
    vehicle_number TEXT,
    license_number TEXT,
    max_capacity_kg DOUBLE PRECISION,
    max_volume_l DOUBLE PRECISION,
    home_latitude DOUBLE PRECISION,
    home_longitude DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT TRUE,
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    last_location_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    route_id UUID,
    order_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled', 'failed')) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]',
    total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    delivery_window_start TIMESTAMPTZ,
    delivery_window_end TIMESTAMPTZ,
    actual_delivery_time TIMESTAMPTZ,
    proof_of_delivery TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'completed', 'cancelled')) DEFAULT 'planned',
    optimized_order TEXT[] DEFAULT '{}',
    total_distance_km DOUBLE PRECISION,
    total_duration_min INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Templates table
CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication')),
    language TEXT NOT NULL DEFAULT 'en',
    header TEXT,
    body TEXT NOT NULL,
    footer TEXT,
    buttons JSONB,
    gupshup_template_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Messages table
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    to_number TEXT NOT NULL,
    from_number TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('template', 'text', 'image', 'document', 'location', 'interactive')),
    content JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
    gupshup_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    razorpay_subscription_id TEXT,
    razorpay_plan_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('created', 'authenticated', 'active', 'paused', 'cancelled', 'expired', 'completed')) DEFAULT 'created',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    quantity INTEGER DEFAULT 1,
    notes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Logs table
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric TEXT NOT NULL CHECK (metric IN ('whatsapp_conversations', 'api_calls', 'routes_optimized', 'orders_processed')),
    count INTEGER NOT NULL DEFAULT 1,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB,
    UNIQUE (organization_id, metric, date)
);

-- Logs table (for observability)
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
    message TEXT NOT NULL,
    context JSONB,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_supabase_user_id ON users(supabase_user_id);
CREATE INDEX idx_customers_organization_id ON customers(organization_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_drivers_organization_id ON drivers(organization_id);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_orders_organization_id ON orders(organization_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_route_id ON orders(route_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_routes_organization_id ON routes(organization_id);
CREATE INDEX idx_routes_driver_id ON routes(driver_id);
CREATE INDEX idx_routes_date ON routes(date);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_whatsapp_templates_organization_id ON whatsapp_templates(organization_id);
CREATE INDEX idx_whatsapp_messages_organization_id ON whatsapp_messages(organization_id);
CREATE INDEX idx_whatsapp_messages_to_number ON whatsapp_messages(to_number);
CREATE INDEX idx_whatsapp_messages_gupshup_id ON whatsapp_messages(gupshup_message_id);
CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_usage_logs_organization_id ON usage_logs(organization_id);
CREATE INDEX idx_logs_organization_id ON logs(organization_id);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_created_at ON logs(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their organization's data
CREATE POLICY "org_isolation" ON organizations FOR ALL USING (id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON users FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON customers FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON drivers FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON orders FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON routes FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON whatsapp_templates FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON whatsapp_messages FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON subscriptions FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON usage_logs FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

CREATE POLICY "org_isolation" ON logs FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
));

-- Service role bypass (for server-side operations)
CREATE POLICY "service_role_all" ON organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON drivers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON routes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON whatsapp_templates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON whatsapp_messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON usage_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON logs FOR ALL USING (auth.role() = 'service_role');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log usage
CREATE OR REPLACE FUNCTION log_usage(
    p_organization_id UUID,
    p_metric TEXT,
    p_count INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_logs (organization_id, metric, count, date, metadata)
    VALUES (p_organization_id, p_metric, p_count, CURRENT_DATE, p_metadata)
    ON CONFLICT (organization_id, metric, date)
    DO UPDATE SET count = usage_logs.count + p_count, metadata = p_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log system events
CREATE OR REPLACE FUNCTION log_event(
    p_level TEXT,
    p_message TEXT,
    p_context JSONB DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_organization_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO logs (organization_id, level, message, context, source)
    VALUES (p_organization_id, p_level, p_message, p_context, p_source);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;