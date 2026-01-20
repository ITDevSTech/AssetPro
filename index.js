const supabaseUrl = 'https://kjgsdcbehsmspadyauhc.supabase.co';
const supabaseKey = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
const db = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('alpine:init', () => {
  Alpine.data('dashboardApp', () => ({

    // ---------- STATS ----------
    totalAssets: 0,
    deployed: 0,
    maintenance: 0,
    disposed: 0,
    replacement: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,

    recentAssets: [],
    recentUsers: [],

    // ---------- SORTABLE ----------
    initSortable() {
      const el = this.$refs.statsGrid;
      if (!el) return;

      // 🔁 RESTORE ORDER
      const savedOrder = JSON.parse(localStorage.getItem('stats-order'));
      if (savedOrder?.length) {
        savedOrder.forEach(key => {
          const card = el.querySelector(`[data-key="${key}"]`);
          if (card) el.appendChild(card);
        });
      }

      // 🔥 ENABLE DRAG
      Sortable.create(el, {
        animation: 150,
        ghostClass: 'opacity-50',
        draggable: '.stat-card',
        onEnd: () => {
          const order = [...el.children].map(c => c.dataset.key);
          localStorage.setItem('stats-order', JSON.stringify(order));
        }
      });
    },

    // ---------- LOAD STATS ----------
    async loadStats() {
      const statuses = [
        ['deployed','Deployed'],
        ['maintenance','Maintenance'],
        ['disposed','Disposed'],
        ['replacement','Replacement'],
        ['pending','Pending'],
        ['inProgress','In Progress'],
        ['resolved','Resolved']
      ];

      const total = await db
        .from('assets')
        .select('id', { count: 'exact', head: true });

      this.totalAssets = total.count || 0;

      for (const [key, value] of statuses) {
        const res = await db
          .from('assets')
          .select('id', { count: 'exact', head: true })
          .eq('status', value);

        this[key] = res.count || 0;
      }

      // RECENT ASSETS
      const { data: assets } = await db
        .from('assets')
        .select('id,name,sn,user_name')
        .order('id', { ascending: false })
        .limit(5);

      this.recentAssets = assets || [];

      // RECENT USERS
      const { data: users } = await db
        .from('users')
        .select('id, username, role')
        .order('id', { ascending: false })
        .limit(5);

      this.recentUsers = users || [];

      this.$nextTick(() => lucide.createIcons());
    },

    // ---------- INIT ----------
    init() {
      if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
      }

      this.loadStats();

      // ⚠️ IMPORTANT: wait DOM
      this.$nextTick(() => this.initSortable());
    }

  }));
});
