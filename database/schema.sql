-- ==========================================================
-- SKEMA DATABASE: JOURNAL HARIAN MOBILKU
-- Kompatibel dengan: SQLite 3, MySQL 8+, PostgreSQL 14+
-- ==========================================================

-- 1. Tabel Profil Kendaraan (Car Profile)
CREATE TABLE IF NOT EXISTS car_profile (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    brand_model VARCHAR(100) NOT NULL,
    manufacture_year INT,
    fuel_type VARCHAR(50) DEFAULT 'Pertamax (RON 92)',
    initial_odometer INT DEFAULT 0,
    oil_interval_km INT DEFAULT 5000,
    last_oil_odometer INT DEFAULT 0,
    next_tax_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Jurnal Aktivitas Harian (Daily Logs)
CREATE TABLE IF NOT EXISTS daily_logs (
    id VARCHAR(50) PRIMARY KEY,
    car_id VARCHAR(50) NOT NULL,
    log_date DATE NOT NULL,
    log_time VARCHAR(10),
    activity_type VARCHAR(30) NOT NULL, -- 'trip', 'fuel', 'expense', 'note'
    category VARCHAR(50) NOT NULL,      -- 'Perjalanan', 'BBM', 'Tol / Parkir', 'Cuci Mobil', dll
    start_odometer INT,
    end_odometer INT,
    distance_km DECIMAL(10, 2) DEFAULT 0,
    cost_rp DECIMAL(15, 2) DEFAULT 0,
    fuel_liters DECIMAL(10, 2) DEFAULT 0,
    fuel_price_per_liter DECIMAL(12, 2) DEFAULT 0,
    fuel_type VARCHAR(50),
    efficiency_kml DECIMAL(8, 2),        -- km per liter
    route_location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES car_profile(id) ON DELETE CASCADE
);

-- 3. Tabel Riwayat Servis & Perawatan (Maintenance Logs)
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id VARCHAR(50) PRIMARY KEY,
    car_id VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,
    odometer INT NOT NULL,
    service_type VARCHAR(200) NOT NULL, -- 'Ganti Oli', 'Servis Berkala', dll
    workshop_name VARCHAR(150),
    cost_rp DECIMAL(15, 2) DEFAULT 0,
    next_target_odometer INT,
    parts_replaced TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES car_profile(id) ON DELETE CASCADE
);

-- ==========================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_logs_date ON daily_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_logs_type ON daily_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_logs_car ON daily_logs(car_id);
CREATE INDEX IF NOT EXISTS idx_maint_date ON maintenance_logs(service_date);
CREATE INDEX IF NOT EXISTS idx_maint_car ON maintenance_logs(car_id);

-- ==========================================================
-- VIEWS FOR REPORTING & ANALYTICS
-- ==========================================================

-- View Ringkasan Pengeluaran per Kategori
CREATE VIEW IF NOT EXISTS v_expense_summary AS
SELECT 
    category,
    COUNT(*) AS total_transactions,
    SUM(cost_rp) AS total_amount,
    AVG(cost_rp) AS average_amount
FROM daily_logs
WHERE cost_rp > 0
GROUP BY category;

-- View Efisiensi Konsumsi BBM
CREATE VIEW IF NOT EXISTS v_fuel_analytics AS
SELECT 
    log_date,
    fuel_type,
    fuel_liters,
    distance_km,
    efficiency_kml,
    cost_rp,
    (cost_rp / NULLIF(distance_km, 0)) AS cost_per_km
FROM daily_logs
WHERE activity_type = 'fuel' AND fuel_liters > 0;
