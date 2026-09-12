-- ==========================================================
-- DATA AWAL (SEED DATA): JOURNAL HARIAN MOBILKU
-- ==========================================================

-- 1. Insert Data Profil Mobil
INSERT INTO car_profile (
    id, name, plate_number, brand_model, manufacture_year, 
    fuel_type, initial_odometer, oil_interval_km, last_oil_odometer, 
    next_tax_date, notes
) VALUES (
    'car-primary',
    'Mobil Pribadi',
    'B 1234 ABC',
    'Toyota Avanza 1.5 G',
    2023,
    'Pertamax (RON 92)',
    15000,
    5000,
    15000,
    '2026-11-20',
    'Mobil operasional harian kantor dan keluarga'
);

-- 2. Insert Data Jurnal Harian
INSERT INTO daily_logs (
    id, car_id, log_date, log_time, activity_type, category,
    start_odometer, end_odometer, distance_km, cost_rp,
    fuel_liters, fuel_price_per_liter, fuel_type, efficiency_kml,
    route_location, notes
) VALUES 
(
    'log-1', 'car-primary', '2026-09-01', '07:30', 'trip', 'Perjalanan',
    15200, 15245, 45.0, 0,
    0, 0, NULL, NULL,
    'Rumah -> Kantor Sudirman', 'Lalu lintas lancar via tol'
),
(
    'log-2', 'car-primary', '2026-09-02', '18:15', 'expense', 'Tol / Parkir',
    15245, 15290, 45.0, 35000,
    0, 0, NULL, NULL,
    'Tol Dalam Kota & Parkir Mall', 'Parkir 3 jam + Tol'
),
(
    'log-3', 'car-primary', '2026-09-05', '08:00', 'fuel', 'BBM',
    15450, 15450, 205.0, 350000,
    27.0, 12950, 'Pertamax (RON 92)', 12.8,
    'SPBU Pertamina MT Haryono', 'Isi Full tank'
),
(
    'log-4', 'car-primary', '2026-09-08', '14:00', 'expense', 'Cuci Mobil',
    15580, 15580, 0, 50000,
    0, 0, NULL, NULL,
    'Car Wash Express', 'Cuci body + vacuum interior'
),
(
    'log-5', 'car-primary', '2026-09-11', '09:30', 'trip', 'Perjalanan',
    15580, 15720, 140.0, 0,
    0, 0, NULL, NULL,
    'Jakarta -> Bogor PP', 'Kunjungan keluarga'
);

-- 3. Insert Data Servis & Perawatan
INSERT INTO maintenance_logs (
    id, car_id, service_date, odometer, service_type,
    workshop_name, cost_rp, next_target_odometer, parts_replaced, notes
) VALUES
(
    'maint-1', 'car-primary', '2026-06-15', 10000, 'Servis Berkala & Ganti Oli Mesin',
    'Bengkel Resmi Toyota Auto2000', 950000, 15000, 'Oli TMO 5W-30, Filter Oli', 'Rotasi ban & cek rem'
),
(
    'maint-2', 'car-primary', '2026-08-20', 15000, 'Ganti Oli Mesin & Filter Udara',
    'Shop & Drive', 650000, 20000, 'Shell Helix 5W-30, Filter Udara', 'Ganti oli rutin'
);
