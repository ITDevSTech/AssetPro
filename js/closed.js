function closedTicketsApp() {
  return {
    db: null,
    tickets: [],
    filteredTickets: [],
    searchQuery: '',

    async init() {
      // Initialize Supabase
      this.db = supabase.createClient(
        'https://kjgsdcbehsmspadyauhc.supabase.co',
        'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy'
      );

      await this.loadClosedTickets();
      this.$nextTick(() => window.lucide?.createIcons());
    },
async loadClosedTickets() {
  const { data, error } = await this.db
    .from('closed_tickets')
    .select('*')
    // Alisin muna ito para makita kung may lumalabas na data
    // .eq('status', 'Closed') 
    .order('id', { ascending: false });

  if (error) {
    console.error('Error loading closed tickets:', error);
  } else {
    this.tickets = data;
    this.filterTickets();
  }
},


    filterTickets() {
      const q = this.searchQuery.toLowerCase();
      this.filteredTickets = this.tickets.filter(t =>
        (t.user_name || '').toLowerCase().includes(q) ||
        (t.sn || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.item_name || '').toLowerCase().includes(q)
      );

      this.$nextTick(() => window.lucide?.createIcons());
    },

    statusClass(status) {
      return {
        'Closed': 'bg-gray-100 text-gray-700',
        'Resolved': 'bg-emerald-100 text-emerald-700',
        'Pending': 'bg-yellow-100 text-yellow-700',
        'In Progress': 'bg-indigo-100 text-indigo-700'
      }[status] || 'bg-slate-100 text-slate-700';
    }
  }
}
