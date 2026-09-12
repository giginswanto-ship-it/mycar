/**
 * Server Backend & REST API Database untuk Journal Harian Mobilku
 * Berjalan menggunakan Node.js bawaan (tanpa perlu install npm tambahan!)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database', 'mycar_db.json');

// Pastikan direktori database ada
if (!fs.existsSync(path.join(__dirname, 'database'))) {
  fs.mkdirSync(path.join(__dirname, 'database'), { recursive: true });
}

// Inisialisasi Database
function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading database file, using fallback initial data:', e);
    }
  }

  // Initial Seed Data
  const initialDb = {
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
    logs: [
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
    ],
    maintenance: [
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
    ]
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Gagal menyimpan ke database file:', e);
  }
}

// Helper MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// Request Parser Helper
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // ==========================================
  // REST API ENDPOINTS
  // ==========================================
  
  // 1. Health check & status
  if (pathname === '/api/status' && req.method === 'GET') {
    return sendJSON(res, { status: 'online', database: 'connected', time: new Date().toISOString() });
  }

  // 2. Profile endpoints
  if (pathname === '/api/profile') {
    const db = loadDatabase();
    if (req.method === 'GET') {
      return sendJSON(res, db.profile);
    }
    if (req.method === 'POST') {
      try {
        const body = await getRequestBody(req);
        db.profile = { ...db.profile, ...body };
        saveDatabase(db);
        return sendJSON(res, { success: true, profile: db.profile });
      } catch (e) {
        return sendJSON(res, { error: 'Invalid JSON body' }, 400);
      }
    }
  }

  // 3. Daily Logs endpoints
  if (pathname === '/api/logs') {
    const db = loadDatabase();
    if (req.method === 'GET') {
      return sendJSON(res, db.logs);
    }
    if (req.method === 'POST') {
      try {
        const body = await getRequestBody(req);
        const newLog = { id: body.id || `log-${Date.now()}`, ...body };
        const idx = db.logs.findIndex(l => l.id === newLog.id);
        if (idx >= 0) {
          db.logs[idx] = newLog;
        } else {
          db.logs.push(newLog);
        }
        saveDatabase(db);
        return sendJSON(res, { success: true, log: newLog });
      } catch (e) {
        return sendJSON(res, { error: 'Invalid JSON body' }, 400);
      }
    }
  }

  // Delete Log
  if (pathname.startsWith('/api/logs/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/logs/', '');
    const db = loadDatabase();
    db.logs = db.logs.filter(l => l.id !== id);
    saveDatabase(db);
    return sendJSON(res, { success: true, message: `Log ${id} deleted` });
  }

  // 4. Maintenance endpoints
  if (pathname === '/api/maintenance') {
    const db = loadDatabase();
    if (req.method === 'GET') {
      return sendJSON(res, db.maintenance);
    }
    if (req.method === 'POST') {
      try {
        const body = await getRequestBody(req);
        const newMaint = { id: body.id || `maint-${Date.now()}`, ...body };
        db.maintenance.push(newMaint);
        saveDatabase(db);
        return sendJSON(res, { success: true, maintenance: newMaint });
      } catch (e) {
        return sendJSON(res, { error: 'Invalid JSON body' }, 400);
      }
    }
  }

  // Delete Maintenance
  if (pathname.startsWith('/api/maintenance/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/maintenance/', '');
    const db = loadDatabase();
    db.maintenance = db.maintenance.filter(m => m.id !== id);
    saveDatabase(db);
    return sendJSON(res, { success: true, message: `Maintenance ${id} deleted` });
  }

  // 5. Full Sync Endpoint
  if (pathname === '/api/sync' && req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      if (body.profile && Array.isArray(body.logs)) {
        const db = {
          profile: body.profile,
          logs: body.logs,
          maintenance: body.maintenance || []
        };
        saveDatabase(db);
        return sendJSON(res, { success: true, message: 'Database fully synchronized' });
      }
      return sendJSON(res, { error: 'Invalid sync payload format' }, 400);
    } catch (e) {
      return sendJSON(res, { error: e.message }, 400);
    }
  }

  // 6. Reset Database
  if (pathname === '/api/reset' && req.method === 'POST') {
    const freshDb = {
      profile: {
        name: 'Mobil Pribadi',
        plate: 'B 1234 ABC',
        model: 'Toyota Avanza 1.5 G',
        year: '2023',
        fuelType: 'Pertamax (RON 92)',
        initialOdo: 0,
        oilIntervalKm: 5000,
        lastOilOdo: 0,
        nextTaxDate: '',
        notes: ''
      },
      logs: [],
      maintenance: []
    };
    saveDatabase(freshDb);
    return sendJSON(res, { success: true, message: 'Database reset successfully' });
  }

  // ==========================================
  // STATIC FILE SERVER
  // ==========================================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Database Server "Journal Harian Mobilku" Aktif!`);
  console.log(`🌐 Buka di browser: http://localhost:${PORT}`);
  console.log(`📁 Database Path: ${DB_FILE}`);
  console.log('====================================================');
});
