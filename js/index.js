const supabaseUrl = 'https://kjgsdcbehsmspadyauhc.supabase.co';
const supabaseKey = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
const db = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('alpine:init', () => {
Alpine.data('dashboardApp', () => ({
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

    const total = await db.from('assets').select('id', { count:'exact', head:true });
    this.totalAssets = total.count || 0;

    for (const [key, value] of statuses) {
      const res = await db.from('assets')
        .select('id', { count:'exact', head:true })
        .eq('status', value);
      this[key] = res.count || 0;
    }

   // Kunin ang 5 pinakabagong assets
const { data: assets } = await db.from('assets')
  .select('id,name,sn,user_name')
  .order('id', { ascending:false })
  .limit(5);

// Kunin ang 5 pinakabagong users
// PAALALA: Siguraduhin kung 'username' o 'name' ang column sa DB mo
const { data: users, error: userError } = await db.from('users')
  .select('id, username, role') // Siguraduhing 'username' at 'role' ito
  .order('id', { ascending: false })
  .limit(5);

if (userError) console.error("Users Error:", userError.message);

this.recentUsers = users || [];


this.recentAssets = assets || [];


// Siguraduhin na i-update ang icons pagkatapos makuha ang data
this.$nextTick(() => lucide.createIcons());

    lucide.createIcons();
  },

  init() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      window.location.href = 'login.html';
      return;
    }
    this.loadStats();
  }
}));
});