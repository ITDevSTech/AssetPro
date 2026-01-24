 const SUPABASE_URL = 'https://kjgsdcbehsmspadyauhc.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        const STATUS_COLORS = {
  'Available': '#6366f1',
  'Deployed': '#22c55e',
  'Maintenance': '#f59e0b',
  'Replacement': '#a855f7',
  'In Progress': '#ef4444',
  'Resolved': '#14b8a6',
  'Disposed': '#64748b'
};


// Fetch asset status counts
 // Fetch asset status counts from Supabase
    async function fetchAssetStatus() {
        const { data, error } = await supabaseClient
            .from('assets')
            .select('status');

        if (error) {
            console.error('Error fetching assets:', error);
            return {};
        }

        const statusCounts = {};
        data.forEach(asset => {
            const status = asset.status || 'Unknown';
            if (!statusCounts[status]) statusCounts[status] = 0;
            statusCounts[status]++;
        });

        return statusCounts;
    }

   document.addEventListener('alpine:init', () => {
    Alpine.data('dashboardChart', () => ({
        async renderChart() {
            const statusData = await fetchAssetStatus();

            // ---- Line Chart ----
            const lineCtx = document.getElementById('lineChart').getContext('2d');
            if (window.lineChart instanceof Chart) window.lineChart.destroy();
window.lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [
            {
                label: 'Available',
                data: [12,14,15,13,16,18],
                borderColor: '#6366f1',
                tension: 0.4
            },
            {
                label: 'Deployed',
                data: [5,6,7,9,10,11],
                borderColor: '#22c55e',
                tension: 0.4
            },
            {
                label: 'Maintenance',
                data: [3,4,2,3,4,3],
                borderColor: '#f59e0b',
                tension: 0.4
            },
            {
                label: 'Replacement',
                data: [1,1,2,2,3,2],
                borderColor: '#a855f7',
                tension: 0.4
            },
            {
                label: 'In Progress',
                data: [4,5,6,5,6,7],
                borderColor: '#ef4444',
                tension: 0.4
            },
            {
                label: 'Resolved',
                data: [2,3,4,6,7,8],
                borderColor: '#14b8a6',
                tension: 0.4
            },
            {
                label: 'Disposed',
                data: [0,1,1,2,2,3],
                borderColor: '#64748b',
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#e5e7eb',
                    usePointStyle: true,
                    padding: 12
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#94a3b8' },
                grid: { display: false }
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' }
            }
        }
    }
});


     

            // ---- Doughnut Chart ----
            const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
            if (window.doughnutChart instanceof Chart) window.doughnutChart.destroy();

           window.doughnutChart = new Chart(doughnutCtx, {
  type: 'doughnut',
  data: {
    labels: Object.keys(statusData),
    datasets: [{
      data: Object.values(statusData),
      backgroundColor: Object.keys(statusData).map(
        status => STATUS_COLORS[status] || '#94a3b8'
      ),
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 10, bottom: 10 }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          color: '#e5e7eb',
          padding: 12,
          boxWidth: 18,
          usePointStyle: true
        }
      }
    }
  }
});

        }
    }));
});
