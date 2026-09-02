-- WhatsApp webhook durability: durable inbox + monotonic delivery state.
-- Apply after 002_whatsapp_webhook_sessions.sql.

-- Durable inbox table for webhook callbacks before acknowledgement.
CREATE TABLE IF NOT EXISTS whatsapp_webhook_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    callback_id TEXT NOT NULL,
    app_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE (organization_id, callback_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_jobs_status_next_attempt
    ON whatsapp_webhook_jobs(status, next_attempt_at)
    WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_jobs_organization_id
    ON whatsapp_webhook_jobs(organization_id);

-- Monotonic delivery state: expand whatsapp_messages status enum and add provider timestamps.
-- The existing status column already has: 'sent', 'delivered', 'read', 'failed'
-- We add provider timestamps and enforce monotonic transitions.

-- Add provider event timestamp columns
ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS provider_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS provider_delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS provider_read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS provider_failed_at TIMESTAMPTZ;

-- Index for delivery state queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_provider_delivered
    ON whatsapp_messages(provider_delivered_at)
    WHERE provider_delivered_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_provider_read
    ON whatsapp_messages(provider_read_at)
    WHERE provider_read_at IS NOT NULL;

-- Enable RLS
ALTER TABLE whatsapp_webhook_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON whatsapp_webhook_jobs FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE supabase_user_id = auth.uid()
    )
);

CREATE POLICY "service_role_all" ON whatsapp_webhook_jobs FOR ALL USING (
    auth.role() = 'service_role'
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_whatsapp_webhook_jobs_updated_at ON whatsapp_webhook_jobs;
CREATE TRIGGER update_whatsapp_webhook_jobs_updated_at
    BEFORE UPDATE ON whatsapp_webhook_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to atomically upsert webhook job and return whether it was newly created
CREATE OR REPLACE FUNCTION upsert_webhook_job(
    p_organization_id UUID,
    p_callback_id TEXT,
    p_app_name TEXT,
    p_event_type TEXT,
    p_payload JSONB
) RETURNS TABLE (
    job_id UUID,
    is_new BOOLEAN,
    current_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO whatsapp_webhook_jobs (
        organization_id, callback_id, app_name, event_type, payload, status
    ) VALUES (
        p_organization_id, p_callback_id, p_app_name, p_event_type, p_payload, 'pending'
    )
    ON CONFLICT (organization_id, callback_id, event_type) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = NOW()
    RETURNING id, (xmax = 0) AS is_new, status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to atomically claim a job for processing
CREATE OR REPLACE FUNCTION claim_webhook_job(
    p_job_id UUID,
    p_max_attempts INTEGER DEFAULT 5
) RETURNS TABLE (
    success BOOLEAN,
    job whatsapp_webhook_jobs
) AS $$
DECLARE
    v_job whatsapp_webhook_jobs;
BEGIN
    UPDATE whatsapp_webhook_jobs
    SET
        status = 'processing',
        attempts = attempts + 1,
        next_attempt_at = NOW() + INTERVAL '1 minute' * POWER(2, attempts),
        updated_at = NOW()
    WHERE id = p_job_id
      AND status IN ('pending', 'failed')
      AND attempts < p_max_attempts
    RETURNING * INTO v_job;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, v_job;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::whatsapp_webhook_jobs;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION complete_webhook_job(
    p_job_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE whatsapp_webhook_jobs
    SET
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark job as failed with error
CREATE OR REPLACE FUNCTION fail_webhook_job(
    p_job_id UUID,
    p_error TEXT,
    p_max_attempts INTEGER DEFAULT 5
) RETURNS VOID AS $$
DECLARE
    v_attempts INTEGER;
BEGIN
    UPDATE whatsapp_webhook_jobs
    SET
        status = CASE
            WHEN attempts + 1 >= p_max_attempts THEN 'failed'
            ELSE 'failed'
        END,
        last_error = p_error,
        next_attempt_at = CASE
            WHEN attempts + 1 >= p_max_attempts THEN NULL
            ELSE NOW() + INTERVAL '1 minute' * POWER(2, attempts + 1)
        END,
        updated_at = NOW()
    WHERE id = p_job_id
    RETURNING attempts INTO v_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim a batch of jobs for processing
CREATE OR REPLACE FUNCTION claim_webhook_jobs_batch(
    p_limit INTEGER DEFAULT 10
) RETURNS SETOF whatsapp_webhook_jobs AS $$
DECLARE
    v_jobs whatsapp_webhook_jobs[];
BEGIN
    -- Atomic claim: update and return claimed jobs
    UPDATE whatsapp_webhook_jobs
    SET
        status = 'processing',
        attempts = attempts + 1,
        next_attempt_at = NOW() + INTERVAL '1 minute' * POWER(2, attempts + 1),
        updated_at = NOW()
    WHERE id IN (
        SELECT id FROM whatsapp_webhook_jobs
        WHERE status IN ('pending', 'failed')
          AND attempts < 5
          AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
        ORDER BY next_attempt_at ASC NULLS FIRST, created_at ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    )
    RETURNING * INTO v_jobs;

    RETURN QUERY SELECT * FROM unnest(v_jobs);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Monotonic status rank: submitted < sent < delivered < read < failed (terminal)
-- Create a helper function to get rank
CREATE OR REPLACE FUNCTION status_rank(p_status TEXT) RETURNS INTEGER AS $$
SELECT CASE p_status
    WHEN 'sent' THEN 1
    WHEN 'delivered' THEN 2
    WHEN 'read' THEN 3
    WHEN 'failed' THEN 4
    ELSE 0
END;
$$ LANGUAGE sql IMMUTABLE;