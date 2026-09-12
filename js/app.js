/**
 * Journal Harian Mobilku - Main Application Logic
 * Hybrid Storage: SQLite / REST API Backend with Offline LocalStorage Fallback
 */

// Storage Keys & API Endpoint
const STORAGE_KEYS = {
  PROFILE: 'mycar_profile_v1',
  LOGS: 'mycar_logs_v1',
  MAINTENANCE: 'mycar_maintenance_v1'
};

const API_BASE_URL = window.location.protocol.startsWith('http') 
  ? window.location.origin 
  : 'http://localhost:3000';

// Data Store
const AppData = {
  isServerConnected: false,
  profile: {
    name: 'Mobil Pribadi',
    plate: 'B 1234 ABC',
    model: 'Toyota Avanza 1.5 G',
    year: '2023',
    fuelType: 'Pertamax (RON 92)',
    initialOdo: 15000,
    oilIntervalKm: 5000,
    lastOilOdo: 15000,
    nextTaxDate: '2026-11-20',
    notes: 'Mobil harian keluarga dan kantor'
  },
  logs: [],
  maintenance: [],

  async init() {
    // 1. Cek koneksi ke Database Server
    await this.checkServerConnection();

    if (this.isServerConnected) {
      await this.fetchFromServer();
    } else {
      this.loadFromLocalStorage();
    }
  },

  async checkServerConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${API_BASE_URL}/api/status`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.isServerConnected = (data.database === 'connected' || data.status === 'online');
      } else {
        this.isServerConnected = false;
      }
    } catch (e) {
      this.isServerConnected = false;
    }
  },

  async fetchFromServer() {
    try {
      const [profRes, logsRes, maintRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/profile`),
        fetch(`${API_BASE_URL}/api/logs`),
        fetch(`${API_BASE_URL}/api/maintenance`)
      ]);

      if (profRes.ok) this.profile = await profRes.json();
      if (logsRes.ok) this.logs = await logsRes.json();
      if (maintRes.ok) this.maintenance = await maintRes.json();

      // Backup ke local storage untuk offline mode
      this.saveLocalStorageOnly();
    } catch (e) {
      console.warn('Gagal memuat dari server, fallback ke local storage:', e);
      this.loadFromLocalStorage();
    }
  },

  loadFromLocalStorage() {
    const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const savedMaintenance = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);

    if (savedProfile) {
      try { this.profile = JSON.parse(savedProfile); } catch (e) { console.error(e); }
    } else {
      this.saveProfile();
    }

    if (savedLogs) {
      try { this.logs = JSON.parse(savedLogs); } catch (e) { console.error(e); }
    } else {
      this.generateDemoData();
      this.saveLogs();
    }

    if (savedMaintenance) {
      try { this.maintenance = JSON.parse(savedMaintenance); } catch (e) { console.error(e); }
    } else {
      this.generateDemoMaintenance();
      this.saveMaintenance();
    }
  },

  generateDemoData() {
    this.logs = [
      {
        id: 'log-1',
        date: '2026-09-01',
        time: '07:30',
        type: 'trip',
        category: 'Perjalanan',
        startOdo: 15200,
        endOdo: 15245,
        distance: 45,
        cost: 0,
        fuelLiters: 0,
        route: 'Rumah -> Kantor Sudirman',
        notes: 'Lalu lintas lancar via tol'
      },
      {
        id: 'log-2',
        date: '2026-09-02',
        time: '18:15',
        type: 'expense',
        category: 'Tol / Parkir',
        startOdo: 15245,
        endOdo: 15290,
        distance: 45,
        cost: 35000,
        fuelLiters: 0,
        route: 'Tol Dalam Kota & Parkir Mall',
        notes: 'Parkir 3 jam + Tol'
      },
      {
        id: 'log-3',
        date: '2026-09-05',
        time: '08:00',
        type: 'fuel',
        category: 'BBM',
        startOdo: 15450,
        endOdo: 15450,
        distance: 205,
        cost: 350000,
        fuelLiters: 27,
        fuelType: 'Pertamax (RON 92)',
        fuelPricePerLiter: 12950,
        efficiency: 12.8,
        route: 'SPBU Pertamina MT Haryono',
        notes: 'Isi Full tank'
      },
      {
        id: 'log-4',
        date: '2026-09-08',
        time: '14:00',
        type: 'expense',
        category: 'Cuci Mobil',
        startOdo: 15580,
        endOdo: 15580,
        distance: 0,
        cost: 50000,
        fuelLiters: 0,
        route: 'Car Wash Express',
        notes: 'Cuci body + vacuum interior'
      },
      {
        id: 'log-5',
        date: '2026-09-11',
        time: '09:30',
        type: 'trip',
        category: 'Perjalanan',
        startOdo: 15580,
        endOdo: 15720,
        distance: 140,
        cost: 0,
        fuelLiters: 0,
        route: 'Jakarta -> Bogor PP',
        notes: 'Kunjungan keluarga'
      }
    ];
  },

  generateDemoMaintenance() {
    this.maintenance = [
      {
        id: 'maint-1',
        date: '2026-06-15',
        odo: 10000,
        serviceType: 'Servis Berkala & Ganti Oli Mesin',
        workshop: 'Bengkel Resmi Toyota Auto2000',
        cost: 950000,
        notes: 'Oli TMO 5W-30 + Filter Oli + Cek Rem & Rotasi Ban',
        nextOdoTarget: 15000
      },
      {
        id: 'maint-2',
        date: '2026-08-20',
        odo: 15000,
        serviceType: 'Ganti Oli Mesin & Filter Udara',
        workshop: 'Shop & Drive',
        cost: 650000,
        notes: 'Ganti oli Shell Helix 5W-30 + filter udara baru',
        nextOdoTarget: 20000
      }
    ];
  },

  async saveProfile() {
    this.saveLocalStorageOnly();
    if (this.isServerConnected) {
      try {
        await fetch(`${API_BASE_URL}/api/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.profile)
        });
      } catch (e) {
        console.warn('Gagal sinkron profile ke server:', e);
      }
    }
  },

  async saveLogs() {
    this.saveLocalStorageOnly();
  },

  async saveSingleLog(logData) {
    const existingIndex = this.logs.findIndex(l => l.id === logData.id);
    if (existingIndex >= 0) {
      this.logs[existingIndex] = logData;
    } else {
      this.logs.push(logData);
    }
    this.saveLocalStorageOnly();

    if (this.isServerConnected) {
      try {
        await fetch(`${API_BASE_URL}/api/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData)
        });
      } catch (e) {
        console.warn('Gagal simpan log ke server database:', e);
      }
    }
  },

  async deleteSingleLog(id) {
    this.logs = this.logs.filter(l => l.id !== id);
    this.saveLocalStorageOnly();

    if (this.isServerConnected) {
      try {
        await fetch(`${API_BASE_URL}/api/logs/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Gagal hapus log di server:', e);
      }
    }
  },

  async saveSingleMaintenance(maintData) {
    this.maintenance.push(maintData);
    this.saveLocalStorageOnly();

    if (this.isServerConnected) {
      try {
        await fetch(`${API_BASE_URL}/api/maintenance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(maintData)
        });
      } catch (e) {
        console.warn('Gagal simpan servis ke database server:', e);
      }
    }
  },

  async deleteSingleMaintenance(id) {
    this.maintenance = this.maintenance.filter(m => m.id !== id);
    this.saveLocalStorageOnly();

    if (this.isServerConnected) {
      try {
        await fetch(`${API_BASE_URL}/api/maintenance/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Gagal hapus servis di server:', e);
      }
    }
  },

  async syncAllToServer() {
    if (!this.isServerConnected) {
      await this.checkServerConnection();
    }
    if (!this.isServerConnected) {
      throw new Error('Server database offline. Jalankan start_server.bat terlebih dahulu.');
    }

    const payload = {
      profile: this.profile,
      logs: this.logs,
      maintenance: this.maintenance
    };

    const res = await fetch(`${API_BASE_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Gagal melakukan sinkronisasi database');
    return true;
  },

  saveLocalStorageOnly() {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(this.profile));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(this.maintenance));
  },

  saveMaintenance() {
    this.saveLocalStorageOnly();
  },

  // Perhitungan Odometer Terkini
  getCurrentOdometer() {
    let maxOdo = Number(this.profile.initialOdo || 0);
    this.logs.forEach(l => {
      if (l.endOdo && Number(l.endOdo) > maxOdo) maxOdo = Number(l.endOdo);
      if (l.startOdo && Number(l.startOdo) > maxOdo) maxOdo = Number(l.startOdo);
    });
    this.maintenance.forEach(m => {
      if (m.odo && Number(m.odo) > maxOdo) maxOdo = Number(m.odo);
    });
    return maxOdo;
  },

  // Perhitungan Jarak Tempuh Bulan Ini
  getMonthlyDistance() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return this.logs.reduce((acc, log) => {
      const logDate = new Date(log.date);
      if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
        return acc + (Number(log.distance) || 0);
      }
      return acc;
    }, 0);
  },

  // Perhitungan Pengeluaran Bulan Ini
  getMonthlyExpenses() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let total = 0;
    this.logs.forEach(log => {
      const logDate = new Date(log.date);
      if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
        total += Number(log.cost || 0);
      }
    });

    this.maintenance.forEach(m => {
      const mDate = new Date(m.date);
      if (mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear) {
        total += Number(m.cost || 0);
      }
    });

    return total;
  },

  // Efisiensi BBM Rata-rata (km/L)
  getAverageFuelEfficiency() {
    const fuelLogs = this.logs.filter(l => l.type === 'fuel' && l.fuelLiters > 0 && l.distance > 0);
    if (fuelLogs.length === 0) return 0;
    const totalKm = fuelLogs.reduce((acc, l) => acc + Number(l.distance), 0);
    const totalLiters = fuelLogs.reduce((acc, l) => acc + Number(l.fuelLiters), 0);
    return totalLiters > 0 ? (totalKm / totalLiters) : 0;
  },

  // Data Log BBM yang Diurutkan
  getFuelLogsSorted() {
    return this.logs
      .filter(l => l.type === 'fuel')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  // Rincian Pengeluaran per Kategori
  getExpenseBreakdown() {
    const breakdown = {
      'BBM': 0,
      'Servis & Perawatan': 0,
      'Tol / Parkir': 0,
      'Cuci Mobil': 0,
      'Lain-lain': 0
    };

    this.logs.forEach(log => {
      const cost = Number(log.cost || 0);
      if (cost <= 0) return;

      if (log.type === 'fuel') {
        breakdown['BBM'] += cost;
      } else if (log.category === 'Tol / Parkir' || (log.route && log.route.toLowerCase().includes('tol'))) {
        breakdown['Tol / Parkir'] += cost;
      } else if (log.category === 'Cuci Mobil') {
        breakdown['Cuci Mobil'] += cost;
      } else {
        breakdown['Lain-lain'] += cost;
      }
    });

    this.maintenance.forEach(m => {
      breakdown['Servis & Perawatan'] += Number(m.cost || 0);
    });

    // Hapus kategori bernilai 0
    Object.keys(breakdown).forEach(key => {
      if (breakdown[key] === 0) delete breakdown[key];
    });

    return breakdown;
  },

  // Data Jarak Tempuh Bulanan (6 Bulan Terakhir)
  getMonthlyDistanceData() {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const labels = [];
    const values = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      labels.push(`${monthNames[mIdx]} ${y}`);

      const monthlySum = this.logs.reduce((acc, log) => {
        const logDate = new Date(log.date);
        if (logDate.getMonth() === mIdx && logDate.getFullYear() === y) {
          return acc + (Number(log.distance) || 0);
        }
        return acc;
      }, 0);
      values.push(monthlySum);
    }

    return { labels, values };
  }
};

// UI Controller
const AppUI = {
  currentTab: 'dashboard',
  logFilterType: 'all',

  init() {
    this.bindEvents();
    this.renderDatabaseStatus();
    this.renderProfile();
    this.renderDashboard();
    this.renderLogsTable();
    this.renderMaintenanceTable();
    this.renderReports();
  },

  bindEvents() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Mobile nav trigger
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        const mobileNav = document.getElementById('mobileNav');
        mobileNav.classList.toggle('hidden');
      });
    }

    // Modal buttons
    document.getElementById('openAddLogBtn')?.addEventListener('click', () => this.openAddLogModal());
    document.getElementById('openAddMaintBtn')?.addEventListener('click', () => this.openAddMaintModal());
    document.getElementById('openEditProfileBtn')?.addEventListener('click', () => this.openEditProfileModal());
    document.getElementById('quickFuelBtn')?.addEventListener('click', () => this.openAddLogModal('fuel'));
    document.getElementById('quickTripBtn')?.addEventListener('click', () => this.openAddLogModal('trip'));
    document.getElementById('quickExpenseBtn')?.addEventListener('click', () => this.openAddLogModal('expense'));

    // DB Sync button
    document.getElementById('dbSyncBtn')?.addEventListener('click', () => this.handleSyncDatabase());

    // Filter type select
    document.getElementById('logFilterType')?.addEventListener('change', (e) => {
      this.logFilterType = e.target.value;
      this.renderLogsTable();
    });

    // Search input
    document.getElementById('logSearchInput')?.addEventListener('input', () => {
      this.renderLogsTable();
    });

    // Log Form type switcher
    document.getElementById('logTypeSelect')?.addEventListener('change', (e) => {
      this.toggleLogFormFields(e.target.value);
    });

    // Odometer auto-calculate distance
    const startOdoInput = document.getElementById('logStartOdo');
    const endOdoInput = document.getElementById('logEndOdo');
    const distanceInput = document.getElementById('logDistance');

    const updateDistance = () => {
      const s = Number(startOdoInput.value) || 0;
      const e = Number(endOdoInput.value) || 0;
      if (e > s && s > 0) {
        distanceInput.value = e - s;
      }
    };
    startOdoInput?.addEventListener('input', updateDistance);
    endOdoInput?.addEventListener('input', updateDistance);

    // Fuel cost auto calculate
    const fuelLitersInput = document.getElementById('logFuelLiters');
    const fuelPricePerLiterInput = document.getElementById('logFuelPricePerLiter');
    const fuelCostInput = document.getElementById('logCost');

    const updateFuelCost = () => {
      const lit = Number(fuelLitersInput.value) || 0;
      const price = Number(fuelPricePerLiterInput.value) || 0;
      if (lit > 0 && price > 0 && document.getElementById('logTypeSelect').value === 'fuel') {
        fuelCostInput.value = Math.round(lit * price);
      }
    };
    fuelLitersInput?.addEventListener('input', updateFuelCost);
    fuelPricePerLiterInput?.addEventListener('input', updateFuelCost);

    // Form Submit Handlers
    document.getElementById('logForm')?.addEventListener('submit', (e) => this.handleSaveLog(e));
    document.getElementById('maintForm')?.addEventListener('submit', (e) => this.handleSaveMaint(e));
    document.getElementById('profileForm')?.addEventListener('submit', (e) => this.handleSaveProfile(e));

    // Data Export & Import Handlers
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportToCSV());
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => this.exportToJSON());
    document.getElementById('importJsonInput')?.addEventListener('change', (e) => this.importFromJSON(e));
    document.getElementById('resetDataBtn')?.addEventListener('click', () => this.confirmResetData());
    document.getElementById('printReportBtn')?.addEventListener('click', () => window.print());
  },

  renderDatabaseStatus() {
    const badge = document.getElementById('dbStatusBadge');
    if (!badge) return;

    if (AppData.isServerConnected) {
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300';
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Database SQLite Aktif`;
      badge.title = 'Terhubung ke database server REST API (database/mycar_db.json)';
    } else {
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer hover:bg-blue-200 transition';
      badge.innerHTML = `<i class="fas fa-database text-xs text-blue-600"></i> Browser Storage`;
      badge.title = 'Klik untuk mencoba menghubungkan ke database server lokal';
      badge.onclick = () => this.handleSyncDatabase();
    }
  },

  async handleSyncDatabase() {
    this.showToast('Memeriksa koneksi database server...', 'info');
    try {
      await AppData.checkServerConnection();
      if (AppData.isServerConnected) {
        await AppData.syncAllToServer();
        this.renderDatabaseStatus();
        this.showToast('Berhasil terhubung & tersinkronisasi ke Database Server!', 'success');
      } else {
        this.renderDatabaseStatus();
        this.showToast('Database server belum aktif. Jalankan start_server.bat untuk mengaktifkan.', 'warning');
      }
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    
    // Desktop Nav
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
      }
    });

    // Mobile Bottom Nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      if (item.dataset.tab === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
      target.classList.add('active');
    }

    if (tabId === 'dashboard' || tabId === 'reports') {
      setTimeout(() => AppCharts.updateAll(), 100);
    }
    if (tabId === 'reports') {
      this.renderReports();
    }
  },

  renderProfile() {
    const p = AppData.profile;
    document.getElementById('headerCarName').textContent = p.name || 'Mobilku';
    document.getElementById('headerPlate').textContent = p.plate || '-';
    document.getElementById('headerModel').textContent = `${p.model} (${p.year})`;

    // Profile settings view
    document.getElementById('profViewName').textContent = p.name || '-';
    document.getElementById('profViewPlate').textContent = p.plate || '-';
    document.getElementById('profViewModel').textContent = p.model || '-';
    document.getElementById('profViewYear').textContent = p.year || '-';
    document.getElementById('profViewFuelType').textContent = p.fuelType || '-';
    document.getElementById('profViewInitOdo').textContent = `${(p.initialOdo || 0).toLocaleString('id-ID')} km`;
    document.getElementById('profViewOilInterval').textContent = `Setiap ${(p.oilIntervalKm || 5000).toLocaleString('id-ID')} km`;
    document.getElementById('profViewNextTax').textContent = p.nextTaxDate ? new Date(p.nextTaxDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-';

    // Print headers
    const printNameEl = document.getElementById('printCarName');
    if (printNameEl) printNameEl.textContent = `${p.name} (${p.model})`;
    const printPlateEl = document.getElementById('printCarPlate');
    if (printPlateEl) printPlateEl.textContent = p.plate || '-';
  },

  renderDashboard() {
    const curOdo = AppData.getCurrentOdometer();
    const monthlyDist = AppData.getMonthlyDistance();
    const monthlyExp = AppData.getMonthlyExpenses();
    const avgEfficiency = AppData.getAverageFuelEfficiency();

    document.getElementById('statCurrentOdo').textContent = `${curOdo.toLocaleString('id-ID')} km`;
    document.getElementById('statMonthlyDistance').textContent = `${monthlyDist.toLocaleString('id-ID')} km`;
    document.getElementById('statMonthlyExpenses').textContent = `Rp ${monthlyExp.toLocaleString('id-ID')}`;
    document.getElementById('statFuelEfficiency').textContent = avgEfficiency > 0 ? `${avgEfficiency.toFixed(1)} km/L` : '-';

    this.renderServiceReminders(curOdo);
    this.renderRecentActivities();
  },

  renderServiceReminders(curOdo) {
    const p = AppData.profile;
    const oilInterval = Number(p.oilIntervalKm) || 5000;
    
    const oilMaints = AppData.maintenance.filter(m => m.serviceType.toLowerCase().includes('oli'));
    let lastOilOdo = Number(p.lastOilOdo || p.initialOdo || 0);
    if (oilMaints.length > 0) {
      const sorted = [...oilMaints].sort((a, b) => b.odo - a.odo);
      lastOilOdo = Number(sorted[0].odo);
    }

    const nextOilTarget = lastOilOdo + oilInterval;
    const remainingOilKm = nextOilTarget - curOdo;

    const oilStatusEl = document.getElementById('oilReminderStatus');
    const oilSubEl = document.getElementById('oilReminderSub');
    const oilProgressEl = document.getElementById('oilProgressBar');

    if (oilStatusEl) {
      if (remainingOilKm <= 0) {
        oilStatusEl.innerHTML = `<span class="text-rose-600 font-bold"><i class="fas fa-exclamation-triangle"></i> Waktunya Ganti Oli!</span>`;
        oilSubEl.textContent = `Lewat ${Math.abs(remainingOilKm).toLocaleString('id-ID')} km (Target: ${nextOilTarget.toLocaleString('id-ID')} km)`;
        if (oilProgressEl) {
          oilProgressEl.style.width = '100%';
          oilProgressEl.className = 'h-2 rounded-full bg-rose-500';
        }
      } else if (remainingOilKm <= 500) {
        oilStatusEl.innerHTML = `<span class="text-amber-600 font-bold"><i class="fas fa-clock"></i> Segera Ganti Oli</span>`;
        oilSubEl.textContent = `Sisa ${remainingOilKm.toLocaleString('id-ID')} km lagi (Target: ${nextOilTarget.toLocaleString('id-ID')} km)`;
        if (oilProgressEl) {
          oilProgressEl.style.width = '90%';
          oilProgressEl.className = 'h-2 rounded-full bg-amber-500';
        }
      } else {
        oilStatusEl.innerHTML = `<span class="text-emerald-600 font-semibold"><i class="fas fa-check-circle"></i> Kondisi Oli Aman</span>`;
        oilSubEl.textContent = `Sisa ${remainingOilKm.toLocaleString('id-ID')} km (Target: ${nextOilTarget.toLocaleString('id-ID')} km)`;
        const percent = Math.max(5, Math.min(100, Math.round(((curOdo - lastOilOdo) / oilInterval) * 100)));
        if (oilProgressEl) {
          oilProgressEl.style.width = `${percent}%`;
          oilProgressEl.className = 'h-2 rounded-full bg-blue-500';
        }
      }
    }

    // Tax Reminder
    const taxStatusEl = document.getElementById('taxReminderStatus');
    const taxSubEl = document.getElementById('taxReminderSub');
    if (taxStatusEl && p.nextTaxDate) {
      const today = new Date();
      const taxDate = new Date(p.nextTaxDate);
      const diffTime = taxDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        taxStatusEl.innerHTML = `<span class="text-rose-600 font-bold"><i class="fas fa-calendar-times"></i> Pajak Telat ${Math.abs(diffDays)} Hari</span>`;
        taxSubEl.textContent = `Jatuh tempo: ${taxDate.toLocaleDateString('id-ID', { dateStyle: 'medium' })}`;
      } else if (diffDays <= 30) {
        taxStatusEl.innerHTML = `<span class="text-amber-600 font-bold"><i class="fas fa-bell"></i> Pajak ${diffDays} Hari Lagi</span>`;
        taxSubEl.textContent = `Jatuh tempo: ${taxDate.toLocaleDateString('id-ID', { dateStyle: 'medium' })}`;
      } else {
        taxStatusEl.innerHTML = `<span class="text-emerald-600 font-semibold"><i class="fas fa-calendar-check"></i> Pajak Masih Aktif</span>`;
        taxSubEl.textContent = `${diffDays} hari lagi (${taxDate.toLocaleDateString('id-ID', { dateStyle: 'medium' })})`;
      }
    }
  },

  renderRecentActivities() {
    const container = document.getElementById('recentActivitiesList');
    if (!container) return;

    const sortedLogs = [...AppData.logs].sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00'))).slice(0, 5);

    if (sortedLogs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 text-slate-400">
          <i class="fas fa-clipboard-list text-3xl mb-2"></i>
          <p class="text-sm">Belum ada aktivitas yang dicatat.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = sortedLogs.map(log => {
      let icon = 'fa-road';
      let iconBg = 'bg-blue-100 text-blue-600';
      let typeLabel = 'Perjalanan';

      if (log.type === 'fuel') {
        icon = 'fa-gas-pump';
        iconBg = 'bg-amber-100 text-amber-600';
        typeLabel = 'BBM';
      } else if (log.type === 'expense') {
        icon = 'fa-receipt';
        iconBg = 'bg-rose-100 text-rose-600';
        typeLabel = log.category || 'Pengeluaran';
      } else if (log.type === 'note') {
        icon = 'fa-sticky-note';
        iconBg = 'bg-slate-100 text-slate-600';
        typeLabel = 'Catatan';
      }

      return `
        <div class="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}">
              <i class="fas ${icon}"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-800 text-sm">${log.route || log.notes || typeLabel}</span>
                <span class="text-xs px-2 py-0.5 rounded-full ${this.getBadgeClass(log.type)}">${typeLabel}</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">${new Date(log.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })} ${log.time ? '• ' + log.time : ''}</p>
            </div>
          </div>
          <div class="text-right">
            ${log.distance > 0 ? `<p class="text-xs font-semibold text-blue-600">+${log.distance} km</p>` : ''}
            ${log.cost > 0 ? `<p class="text-xs font-bold text-slate-800">Rp ${Number(log.cost).toLocaleString('id-ID')}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  getBadgeClass(type) {
    switch (type) {
      case 'trip': return 'badge-trip';
      case 'fuel': return 'badge-fuel';
      case 'expense': return 'badge-expense';
      case 'maintenance': return 'badge-maintenance';
      default: return 'badge-note';
    }
  },

  renderLogsTable() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('logSearchInput')?.value || '').toLowerCase();
    
    let filtered = [...AppData.logs];
    if (this.logFilterType !== 'all') {
      filtered = filtered.filter(l => l.type === this.logFilterType);
    }
    if (searchTerm) {
      filtered = filtered.filter(l => 
        (l.route && l.route.toLowerCase().includes(searchTerm)) ||
        (l.notes && l.notes.toLowerCase().includes(searchTerm)) ||
        (l.category && l.category.toLowerCase().includes(searchTerm)) ||
        (l.fuelType && l.fuelType.toLowerCase().includes(searchTerm))
      );
    }

    filtered.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8 text-slate-400">
            <i class="fas fa-search text-3xl mb-2"></i>
            <p>Tidak ada jurnal yang sesuai.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(log => {
      let typeBadge = '';
      if (log.type === 'trip') typeBadge = `<span class="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">Perjalanan</span>`;
      else if (log.type === 'fuel') typeBadge = `<span class="px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700">Isi BBM</span>`;
      else if (log.type === 'expense') typeBadge = `<span class="px-2 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-700">${log.category || 'Pengeluaran'}</span>`;
      else typeBadge = `<span class="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">Catatan</span>`;

      let detailText = log.route || '-';
      if (log.type === 'fuel') {
        detailText = `<b>${log.fuelLiters || 0} L</b> (${log.fuelType || 'BBM'}) @ Rp ${(log.fuelPricePerLiter || 0).toLocaleString('id-ID')}`;
        if (log.efficiency) detailText += ` <span class="text-emerald-600 font-semibold">• ${log.efficiency.toFixed(1)} km/L</span>`;
      }

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-sm">
          <td class="py-3 px-4 whitespace-nowrap">
            <div class="font-medium text-slate-800">${new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div class="text-xs text-slate-400">${log.time || '-'}</div>
          </td>
          <td class="py-3 px-4">${typeBadge}</td>
          <td class="py-3 px-4">
            <div class="text-slate-800">${detailText}</div>
            ${log.notes ? `<div class="text-xs text-slate-500 italic mt-0.5">${log.notes}</div>` : ''}
          </td>
          <td class="py-3 px-4 whitespace-nowrap text-slate-700">
            ${log.startOdo ? `${log.startOdo.toLocaleString('id-ID')} → ` : ''}${log.endOdo ? log.endOdo.toLocaleString('id-ID') : '-'}
          </td>
          <td class="py-3 px-4 whitespace-nowrap font-medium ${log.distance ? 'text-blue-600' : 'text-slate-400'}">
            ${log.distance ? `${log.distance.toLocaleString('id-ID')} km` : '-'}
          </td>
          <td class="py-3 px-4 whitespace-nowrap font-semibold ${log.cost ? 'text-slate-800' : 'text-slate-400'}">
            ${log.cost ? `Rp ${Number(log.cost).toLocaleString('id-ID')}` : '-'}
          </td>
          <td class="py-3 px-4 whitespace-nowrap text-right space-x-1 no-print">
            <button onclick="AppUI.editLog('${log.id}')" class="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition" title="Edit Log">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="AppUI.deleteLog('${log.id}')" class="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition" title="Hapus Log">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderMaintenanceTable() {
    const tbody = document.getElementById('maintTableBody');
    if (!tbody) return;

    const sorted = [...AppData.maintenance].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400">
            <i class="fas fa-tools text-3xl mb-2"></i>
            <p>Belum ada riwayat servis atau perawatan yang dicatat.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = sorted.map(m => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-sm">
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="font-medium text-slate-800">${new Date(m.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap font-semibold text-blue-600">
          ${(m.odo || 0).toLocaleString('id-ID')} km
        </td>
        <td class="py-3 px-4">
          <div class="font-medium text-slate-800">${m.serviceType}</div>
          <div class="text-xs text-slate-500">${m.workshop || 'Bengkel tidak dicatat'}</div>
          ${m.notes ? `<div class="text-xs text-slate-500 italic mt-0.5">${m.notes}</div>` : ''}
        </td>
        <td class="py-3 px-4 whitespace-nowrap font-semibold text-slate-800">
          Rp ${(m.cost || 0).toLocaleString('id-ID')}
        </td>
        <td class="py-3 px-4 whitespace-nowrap text-slate-600">
          ${m.nextOdoTarget ? `<span class="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-medium">${m.nextOdoTarget.toLocaleString('id-ID')} km</span>` : '-'}
        </td>
        <td class="py-3 px-4 whitespace-nowrap text-right space-x-1 no-print">
          <button onclick="AppUI.deleteMaint('${m.id}')" class="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition" title="Hapus Riwayat">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderReports() {
    const totalDist = AppData.logs.reduce((acc, l) => acc + (Number(l.distance) || 0), 0);
    const totalFuelCost = AppData.logs.filter(l => l.type === 'fuel').reduce((acc, l) => acc + (Number(l.cost) || 0), 0);
    const totalMaintCost = AppData.maintenance.reduce((acc, m) => acc + (Number(m.cost) || 0), 0);
    const totalOtherCost = AppData.logs.filter(l => l.type === 'expense').reduce((acc, l) => acc + (Number(l.cost) || 0), 0);
    const grandTotalExpenses = totalFuelCost + totalMaintCost + totalOtherCost;

    const costPerKm = totalDist > 0 ? (grandTotalExpenses / totalDist) : 0;

    document.getElementById('repTotalDistance').textContent = `${totalDist.toLocaleString('id-ID')} km`;
    document.getElementById('repTotalExpense').textContent = `Rp ${grandTotalExpenses.toLocaleString('id-ID')}`;
    document.getElementById('repTotalFuelExpense').textContent = `Rp ${totalFuelCost.toLocaleString('id-ID')}`;
    document.getElementById('repTotalMaintExpense').textContent = `Rp ${totalMaintCost.toLocaleString('id-ID')}`;
    document.getElementById('repTotalOtherExpense').textContent = `Rp ${totalOtherCost.toLocaleString('id-ID')}`;
    document.getElementById('repCostPerKm').textContent = `Rp ${Math.round(costPerKm).toLocaleString('id-ID')} / km`;
  },

  // Modal Handlers
  openAddLogModal(defaultType = 'trip') {
    const form = document.getElementById('logForm');
    form.reset();
    document.getElementById('logId').value = '';
    document.getElementById('logModalTitle').textContent = 'Tambah Jurnal Harian';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('logDate').value = today;
    
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('logTime').value = `${hours}:${mins}`;

    const curOdo = AppData.getCurrentOdometer();
    document.getElementById('logStartOdo').value = curOdo || '';
    document.getElementById('logFuelPricePerLiter').value = '12950';

    document.getElementById('logTypeSelect').value = defaultType;
    this.toggleLogFormFields(defaultType);

    document.getElementById('logModal').classList.remove('hidden');
  },

  editLog(id) {
    const log = AppData.logs.find(l => l.id === id);
    if (!log) return;

    document.getElementById('logId').value = log.id;
    document.getElementById('logModalTitle').textContent = 'Edit Jurnal Harian';
    document.getElementById('logDate').value = log.date || '';
    document.getElementById('logTime').value = log.time || '';
    document.getElementById('logTypeSelect').value = log.type || 'trip';
    document.getElementById('logStartOdo').value = log.startOdo || '';
    document.getElementById('logEndOdo').value = log.endOdo || '';
    document.getElementById('logDistance').value = log.distance || '';
    document.getElementById('logCost').value = log.cost || '';
    document.getElementById('logRoute').value = log.route || '';
    document.getElementById('logCategorySelect').value = log.category || 'Tol / Parkir';
    document.getElementById('logFuelLiters').value = log.fuelLiters || '';
    document.getElementById('logFuelPricePerLiter').value = log.fuelPricePerLiter || '';
    document.getElementById('logFuelType').value = log.fuelType || AppData.profile.fuelType || '';
    document.getElementById('logNotes').value = log.notes || '';

    this.toggleLogFormFields(log.type || 'trip');
    document.getElementById('logModal').classList.remove('hidden');
  },

  async deleteLog(id) {
    if (confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
      await AppData.deleteSingleLog(id);
      this.refreshAllViews();
      this.showToast('Jurnal berhasil dihapus', 'success');
    }
  },

  toggleLogFormFields(type) {
    const tripFields = document.getElementById('logTripFields');
    const fuelFields = document.getElementById('logFuelFields');
    const expenseFields = document.getElementById('logExpenseFields');

    if (tripFields) tripFields.classList.add('hidden');
    if (fuelFields) fuelFields.classList.add('hidden');
    if (expenseFields) expenseFields.classList.add('hidden');

    if (type === 'trip') {
      tripFields?.classList.remove('hidden');
    } else if (type === 'fuel') {
      tripFields?.classList.remove('hidden');
      fuelFields?.classList.remove('hidden');
    } else if (type === 'expense') {
      expenseFields?.classList.remove('hidden');
    }
  },

  async handleSaveLog(e) {
    e.preventDefault();
    const id = document.getElementById('logId').value || `log-${Date.now()}`;
    const date = document.getElementById('logDate').value;
    const time = document.getElementById('logTime').value;
    const type = document.getElementById('logTypeSelect').value;
    const startOdo = Number(document.getElementById('logStartOdo').value) || 0;
    const endOdo = Number(document.getElementById('logEndOdo').value) || startOdo;
    const distance = Number(document.getElementById('logDistance').value) || (endOdo > startOdo ? endOdo - startOdo : 0);
    const cost = Number(document.getElementById('logCost').value) || 0;
    const notes = document.getElementById('logNotes').value;
    const route = document.getElementById('logRoute').value;

    let category = 'Perjalanan';
    let fuelLiters = 0;
    let fuelPricePerLiter = 0;
    let fuelType = '';
    let efficiency = null;

    if (type === 'fuel') {
      category = 'BBM';
      fuelLiters = Number(document.getElementById('logFuelLiters').value) || 0;
      fuelPricePerLiter = Number(document.getElementById('logFuelPricePerLiter').value) || 0;
      fuelType = document.getElementById('logFuelType').value;
      if (fuelLiters > 0 && distance > 0) {
        efficiency = distance / fuelLiters;
      }
    } else if (type === 'expense') {
      category = document.getElementById('logCategorySelect').value;
    } else if (type === 'note') {
      category = 'Catatan';
    }

    const logData = {
      id,
      date,
      time,
      type,
      category,
      startOdo,
      endOdo,
      distance,
      cost,
      fuelLiters,
      fuelPricePerLiter,
      fuelType,
      efficiency,
      route,
      notes
    };

    await AppData.saveSingleLog(logData);

    this.showToast('Jurnal berhasil disimpan ke database!', 'success');
    this.closeModals();
    this.refreshAllViews();
  },

  openAddMaintModal() {
    const form = document.getElementById('maintForm');
    form.reset();
    document.getElementById('maintDate').value = new Date().toISOString().split('T')[0];
    const curOdo = AppData.getCurrentOdometer();
    document.getElementById('maintOdo').value = curOdo || '';
    document.getElementById('maintNextOdo').value = (curOdo || 0) + Number(AppData.profile.oilIntervalKm || 5000);
    document.getElementById('maintModal').classList.remove('hidden');
  },

  async handleSaveMaint(e) {
    e.preventDefault();
    const id = `maint-${Date.now()}`;
    const date = document.getElementById('maintDate').value;
    const odo = Number(document.getElementById('maintOdo').value) || 0;
    const serviceType = document.getElementById('maintServiceType').value;
    const workshop = document.getElementById('maintWorkshop').value;
    const cost = Number(document.getElementById('maintCost').value) || 0;
    const nextOdoTarget = Number(document.getElementById('maintNextOdo').value) || 0;
    const notes = document.getElementById('maintNotes').value;

    const maintData = {
      id,
      date,
      odo,
      serviceType,
      workshop,
      cost,
      nextOdoTarget,
      notes
    };

    await AppData.saveSingleMaintenance(maintData);

    this.showToast('Riwayat servis berhasil dicatat ke database!', 'success');
    this.closeModals();
    this.refreshAllViews();
  },

  async deleteMaint(id) {
    if (confirm('Hapus riwayat servis ini?')) {
      await AppData.deleteSingleMaintenance(id);
      this.refreshAllViews();
      this.showToast('Riwayat servis telah dihapus', 'success');
    }
  },

  openEditProfileModal() {
    const p = AppData.profile;
    document.getElementById('profName').value = p.name || '';
    document.getElementById('profPlate').value = p.plate || '';
    document.getElementById('profModel').value = p.model || '';
    document.getElementById('profYear').value = p.year || '';
    document.getElementById('profFuelType').value = p.fuelType || '';
    document.getElementById('profInitialOdo').value = p.initialOdo || 0;
    document.getElementById('profOilInterval').value = p.oilIntervalKm || 5000;
    document.getElementById('profNextTaxDate').value = p.nextTaxDate || '';
    document.getElementById('profNotes').value = p.notes || '';

    document.getElementById('profileModal').classList.remove('hidden');
  },

  async handleSaveProfile(e) {
    e.preventDefault();
    AppData.profile = {
      name: document.getElementById('profName').value,
      plate: document.getElementById('profPlate').value,
      model: document.getElementById('profModel').value,
      year: document.getElementById('profYear').value,
      fuelType: document.getElementById('profFuelType').value,
      initialOdo: Number(document.getElementById('profInitialOdo').value) || 0,
      oilIntervalKm: Number(document.getElementById('profOilInterval').value) || 5000,
      nextTaxDate: document.getElementById('profNextTaxDate').value,
      notes: document.getElementById('profNotes').value
    };

    await AppData.saveProfile();
    this.showToast('Profil mobil berhasil diperbarui di database!', 'success');
    this.closeModals();
    this.refreshAllViews();
  },

  closeModals() {
    document.querySelectorAll('.modal-container').forEach(m => m.classList.add('hidden'));
  },

  refreshAllViews() {
    this.renderDatabaseStatus();
    this.renderProfile();
    this.renderDashboard();
    this.renderLogsTable();
    this.renderMaintenanceTable();
    this.renderReports();
    AppCharts.updateAll();
  },

  // Export to CSV
  exportToCSV() {
    let csvContent = '\uFEFF';
    csvContent += 'Tanggal,Waktu,Kategori,Tipe,Rute / Keterangan,Odo Awal,Odo Akhir,Jarak (km),Liter BBM,Biaya (Rp),Catatan\n';

    AppData.logs.forEach(l => {
      const row = [
        `"${l.date || ''}"`,
        `"${l.time || ''}"`,
        `"${l.category || ''}"`,
        `"${l.type || ''}"`,
        `"${(l.route || '').replace(/"/g, '""')}"`,
        l.startOdo || 0,
        l.endOdo || 0,
        l.distance || 0,
        l.fuelLiters || 0,
        l.cost || 0,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Journal_Mobil_${AppData.profile.plate.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Data berhasil diekspor ke format CSV / Excel!', 'success');
  },

  // Export to JSON Backup
  exportToJSON() {
    const backupData = {
      profile: AppData.profile,
      logs: AppData.logs,
      maintenance: AppData.maintenance,
      exportedAt: new Date().toISOString()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Backup_MyCar_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    this.showToast('Backup JSON berhasil diunduh!', 'success');
  },

  // Import from JSON Backup
  importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.profile && imported.logs) {
          AppData.profile = imported.profile;
          AppData.logs = imported.logs;
          AppData.maintenance = imported.maintenance || [];
          
          if (AppData.isServerConnected) {
            await AppData.syncAllToServer();
          } else {
            AppData.saveLocalStorageOnly();
          }

          this.refreshAllViews();
          this.showToast('Data backup berhasil dipulihkan!', 'success');
        } else {
          alert('Format file JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  async confirmResetData() {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data jurnal mobil di database?')) {
      localStorage.clear();
      AppData.logs = [];
      AppData.maintenance = [];
      AppData.saveLocalStorageOnly();

      if (AppData.isServerConnected) {
        try {
          await fetch(`${API_BASE_URL}/api/reset`, { method: 'POST' });
        } catch (e) {
          console.warn('Gagal reset server:', e);
        }
      }

      this.refreshAllViews();
      this.showToast('Semua data database berhasil dibersihkan.', 'warning');
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'fa-info-circle';
    let bg = 'bg-slate-800';

    if (type === 'success') {
      icon = 'fa-check-circle';
      bg = 'bg-emerald-600';
    } else if (type === 'warning') {
      icon = 'fa-exclamation-circle';
      bg = 'bg-amber-600';
    } else if (type === 'error') {
      icon = 'fa-times-circle';
      bg = 'bg-rose-600';
    }

    toast.classList.add(bg);
    toast.innerHTML = `
      <i class="fas ${icon} text-lg"></i>
      <div class="flex-1">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// PWA & Mobile App Manager
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.classList.remove('hidden');

  document.getElementById('pwaInstallBtn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        AppUI.showToast('Aplikasi MyCar sedang dipasang di HP Anda!', 'success');
      }
      deferredPrompt = null;
      if (banner) banner.classList.add('hidden');
    }
  });
});

window.addEventListener('appinstalled', () => {
  AppUI.showToast('Aplikasi MyCar berhasil dipasang di layar utama!', 'success');
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.classList.add('hidden');
});

// Register Service Worker
if ('serviceWorker' in navigator && (window.location.protocol.startsWith('http') || window.location.protocol.startsWith('https'))) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[PWA] Service Worker registered with scope:', reg.scope))
      .catch((err) => console.log('[PWA] Service Worker registration failed:', err));
  });
}

// Global App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await AppData.init();
  AppUI.init();
  AppCharts.init();

  // Handle URL shortcut params
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  if (action === 'fuel') {
    setTimeout(() => AppUI.openAddLogModal('fuel'), 300);
  } else if (action === 'trip') {
    setTimeout(() => AppUI.openAddLogModal('trip'), 300);
  } else if (action === 'maintenance') {
    setTimeout(() => AppUI.openAddMaintModal(), 300);
  }
});

