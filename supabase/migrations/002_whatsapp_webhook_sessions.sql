-- WhatsApp webhook reliability: idempotency and per-contact sessions.
-- Apply after 001_initial_schema.sql.

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    phone TEXT NOT NULL CHECK (phone ~ '^91[6-9][0-9]{9}$'),
    state TEXT NOT NULL CHECK (state IN (
        'awaiting_business_type',
        'awaiting_stop',
        'awaiting_driver'
    )),
    context JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, phone)
);

-- Gupshup retries callbacks until a fast 2xx acknowledgement is received.
-- IDs are idempotent per Gupshup app/tenant; PostgreSQL permits multiple
-- NULL values for legacy/outbound rows that have no provider ID.
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_messages_org_gupshup_id_unique
    ON whatsapp_messages(organization_id, gupshup_message_id);

-- A contact/driver phone is unique inside one tenant and can therefore be
-- safely upserted by the WhatsApp onboarding flow.
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_organization_phone_unique
    ON customers(organization_id, phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_organization_phone_unique
    ON drivers(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_expiry
    ON whatsapp_sessions(expires_at);

-- The V2 API emits more inbound types than the original scaffold allowed.
ALTER TABLE whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_type_check;
ALTER TABLE whatsapp_messages ADD CONSTRAINT whatsapp_messages_type_check
    CHECK (type IN (
        'template', 'text', 'image', 'document', 'audio', 'video',
        'contact', 'location', 'interactive', 'sticker', 'reaction'
    ));

ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON whatsapp_sessions FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
    )
);

CREATE POLICY "service_role_all" ON whatsapp_sessions FOR ALL USING (
    auth.role() = 'service_role'
);

DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at ON whatsapp_sessions;
CREATE TRIGGER update_whatsapp_sessions_updated_at
    BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
