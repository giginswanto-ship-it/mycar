/**
 * Charts module for Journal Harian Mobilku
 * Powered by Chart.js
 */

const AppCharts = {
  fuelChart: null,
  expenseChart: null,
  distanceChart: null,

  init() {
    this.initFuelChart();
    this.initExpenseChart();
    this.initDistanceChart();
  },

  // 1. Grafik Efisiensi BBM (km/L)
  initFuelChart() {
    const ctx = document.getElementById('fuelEfficiencyChart');
    if (!ctx) return;

    if (this.fuelChart) {
      this.fuelChart.destroy();
    }

    const logs = AppData.getFuelLogsSorted();
    const labels = logs.map(l => l.date);
    const data = logs.map(l => l.efficiency ? parseFloat(l.efficiency.toFixed(2)) : null);

    this.fuelChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Belum ada data'],
        datasets: [{
          label: 'Efisiensi BBM (km / Liter)',
          data: data.length ? data : [0],
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#1d4ed8',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.raw ? context.raw + ' km/L' : 'Data tidak lengkap'}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: '#f1f5f9' },
            title: { display: true, text: 'km / Liter', color: '#64748b' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  },

  // 2. Grafik Distribusi Pengeluaran
  initExpenseChart() {
    const ctx = document.getElementById('expenseBreakdownChart');
    if (!ctx) return;

    if (this.expenseChart) {
      this.expenseChart.destroy();
    }

    const expensesByCategory = AppData.getExpenseBreakdown();
    const categories = Object.keys(expensesByCategory);
    const amounts = Object.values(expensesByCategory);

    const colors = [
      '#f59e0b', // BBM (Amber)
      '#ef4444', // Servis (Red)
      '#3b82f6', // Tol (Blue)
      '#10b981', // Parkir (Green)
      '#8b5cf6', // Cuci (Purple)
      '#6b7280'  // Lainnya (Gray)
    ];

    this.expenseChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.length ? categories : ['Belum ada pengeluaran'],
        datasets: [{
          data: amounts.length ? amounts : [1],
          backgroundColor: categories.length ? colors.slice(0, categories.length) : ['#e2e8f0'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                return ` Rp ${val.toLocaleString('id-ID')}`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  },

  // 3. Grafik Jarak Tempuh Bulanan
  initDistanceChart() {
    const ctx = document.getElementById('monthlyDistanceChart');
    if (!ctx) return;

    if (this.distanceChart) {
      this.distanceChart.destroy();
    }

    const distanceData = AppData.getMonthlyDistanceData();

    this.distanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: distanceData.labels.length ? distanceData.labels : ['Bulan Ini'],
        datasets: [{
          label: 'Jarak Tempuh (km)',
          data: distanceData.values.length ? distanceData.values : [0],
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          hoverBackgroundColor: '#1d4ed8'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.raw ? context.raw.toLocaleString('id-ID') : 0} km`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            title: { display: true, text: 'Total km', color: '#64748b' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  },

  updateAll() {
    this.initFuelChart();
    this.initExpenseChart();
    this.initDistanceChart();
  }
};
