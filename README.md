# 🚗 Journal Harian Mobilku (MyCar Logbook)

Aplikasi Web modern (Single Page App & Hybrid Database Server) untuk memantau performa harian kendaraan, konsumsi bahan bakar (*Full-to-Full fuel efficiency*), riwayat servis berkala, pengeluaran tol/parkir, dan pengingat jatuh tempo pajak STNK.

---

## 🌟 Fitur Utama

- **📊 Dashboard & Ringkasan Metrik**:
  - Odometer Terkini & Total Jarak Tempuh Bulanan.
  - Efisiensi BBM Rata-rata ($km/\text{Liter}$) & Estimasi Biaya per km.
  - Total Pengeluaran Bulanan Terpadu.
- **⛽ Pelacak Konsumsi BBM**:
  - Catat SPBU, jenis bahan bakar (Pertamax, Pertalite, Shell, Dexlite, dll.), jumlah liter, harga/liter.
  - Perhitungan otomatis efisiensi kilometer per liter.
- **🔧 Riwayat Servis & Perawatan (Maintenance)**:
  - Pelacakan ganti oli mesin/transmisi, aki, ban, filter, dan servis berkala.
  - Pengingat pintar (Smart Reminder) target kilometer servis dan jatuh tempo STNK.
- **📈 Visualisasi Grafik (Chart.js)**:
  - Grafik tren efisiensi konsumsi BBM.
  - Diagram lingkaran distribusi pengeluaran.
  - Grafik batang jarak tempuh 6 bulan terakhir.
- **🗄️ Hybrid Database & Storage**:
  - Mode Server: Didukung REST API lokal berbasis Node.js yang menyimpan data ke berkas database secara persisten.
  - Mode Browser Offline: Didukung `LocalStorage` otomatis jika dibuka langsung tanpa server.
  - Skrip DDL/DML SQL lengkap (`schema.sql` & `seed.sql`) untuk SQLite, MySQL, atau PostgreSQL.
- **📑 Ekspor & Laporan**:
  - Ekspor ke format **Excel / CSV** (dengan BOM UTF-8).
  - Backup & Restore format **JSON**.
  - Cetak Laporan / Simpan PDF (*Print-friendly Layout*).

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan Database Server Lokal (Direkomendasikan)
1. Klik ganda pada berkas **`start_server.bat`**, atau
2. Buka terminal di folder proyek dan ketik:
   ```bash
   node server.js
   ```
3. Buka browser di alamat [http://localhost:3000](http://localhost:3000).

### Cara 2: Membuka Langsung di Browser (Offline Mode)
Cukup klik ganda berkas **`index.html`** di laptop atau smartphone Anda.

---

## 📁 Struktur Direktori

```text
MYCAR/
├── database/
│   ├── schema.sql         # Skema tabel relasional SQL (DDL)
│   └── seed.sql           # Data awal contoh SQL (DML)
├── css/
│   └── styles.css         # Styling kustom & print stylesheet
├── js/
│   ├── app.js             # Logika utama, REST API adapter, state management
│   └── charts.js          # Inisialisasi visualisasi grafik Chart.js
├── index.html             # Antarmuka web utama
├── server.js              # Server REST API backend Node.js
├── start_server.bat       # Shortcut Windows 1-klik
├── .gitignore
└── README.md
```

---

## 🛠️ Lisensi & Hak Cipta
Dibuat dengan ❤️ untuk kemudahan pengelolaan operasional kendaraan pribadi dan operasional.
