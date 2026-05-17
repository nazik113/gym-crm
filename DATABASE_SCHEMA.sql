-- ============================================================
-- GYM CRM — Full PostgreSQL Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ROLES ──────────────────────────────────────────────────
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,       -- admin | trainer | client
    display_name VARCHAR(100) NOT NULL,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    avatar VARCHAR(500),
    password VARCHAR(255) NOT NULL,
    qr_code VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_in_gym BOOLEAN DEFAULT FALSE,
    gym_entered_at TIMESTAMPTZ,
    trainer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    remember_token VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_trainer ON users(trainer_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_qr ON users(qr_code);
CREATE INDEX idx_users_in_gym ON users(is_in_gym) WHERE is_in_gym = TRUE;

-- ─── SUBSCRIPTION PLANS ──────────────────────────────────────
CREATE TABLE subscription_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    sessions_count INTEGER,              -- NULL = unlimited
    is_active BOOLEAN DEFAULT TRUE,
    color VARCHAR(7) DEFAULT '#6366F1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REGISTRATION CODES ──────────────────────────────────────
CREATE TABLE registration_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id),
    role_id BIGINT NOT NULL REFERENCES roles(id),
    hidden_first_name VARCHAR(100),
    hidden_last_name VARCHAR(100),
    hidden_phone VARCHAR(20),
    subscription_plan_id BIGINT REFERENCES subscription_plans(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','used','expired','revoked')),
    activated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_regcodes_code ON registration_codes(code);
CREATE INDEX idx_regcodes_status ON registration_codes(status);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES subscription_plans(id),
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    price_paid DECIMAL(10,2) NOT NULL,
    sessions_remaining INTEGER,
    starts_at DATE NOT NULL,
    expires_at DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active','expired','cancelled','pending')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subs_user ON subscriptions(user_id);
CREATE INDEX idx_subs_status ON subscriptions(status);
CREATE INDEX idx_subs_expires ON subscriptions(expires_at);

-- ─── ATTENDANCE ──────────────────────────────────────────────
CREATE TABLE attendance (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
    checked_in_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    check_in_method VARCHAR(20) DEFAULT 'qr_scan' CHECK (check_in_method IN ('qr_scan','manual','system')),
    checked_in_at TIMESTAMPTZ NOT NULL,
    checked_out_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(checked_in_at);

-- ─── WORKOUT PLANS ───────────────────────────────────────────
CREATE TABLE workout_plans (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trainer_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active','completed','draft')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workout_days (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    day_number INTEGER NOT NULL,
    muscle_groups VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exercises (
    id BIGSERIAL PRIMARY KEY,
    workout_day_id BIGINT NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    sets INTEGER,
    reps VARCHAR(50),
    weight_kg DECIMAL(6,2),
    rest_seconds INTEGER,
    duration_minutes INTEGER,
    instructions TEXT,
    video_url VARCHAR(500),
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NUTRITION PLANS ─────────────────────────────────────────
CREATE TABLE nutrition_plans (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trainer_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    daily_calories INTEGER,
    protein_g INTEGER,
    carbs_g INTEGER,
    fats_g INTEGER,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active','completed','draft')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meals (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    time_of_day TIME,
    calories INTEGER,
    protein_g INTEGER,
    carbs_g INTEGER,
    fats_g INTEGER,
    foods JSONB,
    notes TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEASUREMENTS ────────────────────────────────────────────
CREATE TABLE measurements (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    body_fat_percent DECIMAL(4,2),
    muscle_mass_kg DECIMAL(5,2),
    chest_cm DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    hips_cm DECIMAL(5,2),
    left_arm_cm DECIMAL(5,2),
    right_arm_cm DECIMAL(5,2),
    left_leg_cm DECIMAL(5,2),
    right_leg_cm DECIMAL(5,2),
    notes TEXT,
    measured_at DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_measurements_client ON measurements(client_id, measured_at);

-- ─── NOTES ───────────────────────────────────────────────────
CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(200),
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('general','health','progress','warning')),
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ─── AUDIT LOGS ──────────────────────────────────────────────
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    model_type VARCHAR(100),
    model_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_model ON audit_logs(model_type, model_id);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(255) NOT NULL,
    notifiable_type VARCHAR(255) NOT NULL,
    notifiable_id BIGINT NOT NULL,
    data JSONB NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_notifiable ON notifications(notifiable_type, notifiable_id);

-- ─── SEED ROLES ──────────────────────────────────────────────
INSERT INTO roles (name, display_name, permissions) VALUES
('admin', 'Administrator', '["*"]'::jsonb),
('trainer', 'Trainer', '["clients.view","clients.workouts","clients.nutrition","clients.notes","qr.scan"]'::jsonb),
('client', 'Client', '["profile.view","qr.view","workouts.view","nutrition.view","attendance.view"]'::jsonb);

