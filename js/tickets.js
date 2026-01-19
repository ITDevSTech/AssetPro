function ticketsApp() {
  return {
    db: null,
    tickets: [],
    filteredTickets: [],
    searchQuery: '',
    ticketSearch: '',
    searchResults: [],
    showTicketModal: false,
    editMode: false,
    isAdmin: localStorage.getItem('userRole') === 'Administrator',

    currentTicket: {
      id: null,
      asset_id: null,
      sn: '',
      item_name: '',
      user_name: '',
      description: '',
      status: 'Pending'
    },

    async init() {
      this.db = supabase.createClient(
        'https://kjgsdcbehsmspadyauhc.supabase.co',
        'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy'
      );

      await this.loadTickets();
      this.$nextTick(() => window.lucide?.createIcons());
    },

  async loadTickets() {
  try {
    const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
    const username = localStorage.getItem('userName');

    let query = this.db.from('tickets').select('*').order('id', { ascending: false });

    if (userRole !== 'administrator') {
      if (!username) {
        console.warn('No username found in localStorage for non-admin user.');
        this.tickets = [];
        this.filteredTickets = [];
        return;
      }
      query = query.eq('user_name', username.trim()); // Trim to avoid spaces
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading tickets:', error);
      return;
    }

    this.tickets = data || [];
    this.filterTickets();

  } catch (err) {
    console.error('Unexpected error loading tickets:', err);
  }
},


filterTickets() {
  const q = (this.searchQuery || '').toLowerCase();

  // Filter only the tickets already loaded (respecting the role filtering)
  this.filteredTickets = this.tickets.filter(t =>
    (t.user_name || '').toLowerCase().includes(q) ||
    (t.sn || '').toLowerCase().includes(q) ||
    (t.description || '').toLowerCase().includes(q)
  );

  // Re-render icons
  this.$nextTick(() => window.lucide?.createIcons());
},


    openModal() {
      this.editMode = false;
      this.currentTicket = {
        id: null,
        asset_id: null,
        sn: '',
        item_name: '',
        user_name: '',
        description: '',
        status: 'Pending'
      };
      this.ticketSearch = '';
      this.searchResults = [];
      this.showTicketModal = true;
    },

    closeModal() {
      this.showTicketModal = false;
    },

    editTicket(ticket) {
      this.editMode = true;
      this.currentTicket = { ...ticket };
      this.showTicketModal = true;
    },

 async searchAssets() {
  if (!this.ticketSearch) {
    this.searchResults = [];
    return;
  }

  const q = `%${this.ticketSearch}%`;

  let query = this.db
    .from('assets')
    .select('id, user_name, sn, name')
    .or(`user_name.ilike.${q},sn.ilike.${q}`)
    .limit(5);

  // If not admin, filter by the logged-in user
  if (localStorage.getItem('userRole')?.toLowerCase() !== 'administrator') {
    const username = localStorage.getItem('userName');
    query = query.eq('user_name', username);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Search assets error:', error);
    this.searchResults = [];
    return;
  }

  this.searchResults = data || [];
},


   selectAsset(asset) {
    this.currentTicket.asset_id = asset.id;  // ✅ assign asset id
    this.currentTicket.user_name = asset.user_name;
    this.currentTicket.sn = asset.sn;
    this.currentTicket.item_name = asset.name;
    this.ticketSearch = '';
    this.searchResults = [];
},

    async saveTicket() {
  if (!this.currentTicket.user_name || !this.currentTicket.description) {
    alert('Username and description are required.');
    return;
  }

  try {
    if (this.editMode) {
      // 1️⃣ UPDATE ticket
      const { error: ticketErr } = await this.db
        .from('tickets')
        .update({
          description: this.currentTicket.description,
          status: this.currentTicket.status
        })
        .eq('id', this.currentTicket.id);

      if (ticketErr) throw ticketErr;

      // 2️⃣ UPDATE asset status by SN
      if (this.currentTicket.sn) {
        const { error: assetErr } = await this.db
          .from('assets')
          .update({ status: this.currentTicket.status })
          .eq('sn', this.currentTicket.sn);

        if (assetErr) throw assetErr;
      }

      alert('Ticket updated and asset status updated!');

    } else {
      // INSERT ticket
      const { data: { user } } = await this.db.auth.getUser();
      const { error: insertErr } = await this.db
        .from('tickets')
        .insert([{
          sn: this.currentTicket.sn,
          item_name: this.currentTicket.item_name,
          user_name: this.currentTicket.user_name,
          description: this.currentTicket.description,
          status: this.currentTicket.status,
          user_id: user ? user.id : null
        }]);

      if (insertErr) throw insertErr;

      // UPDATE asset status by SN
      if (this.currentTicket.sn) {
        const { error: assetErr } = await this.db
          .from('assets')
          .update({ status: this.currentTicket.status })
          .eq('sn', this.currentTicket.sn);

        if (assetErr) throw assetErr;
      }

      alert('Ticket added and asset status updated!');
    }

    this.closeModal();
    await this.loadTickets();

  } catch (err) {
    console.error(err);
    alert('Operation failed: ' + err.message);
  }
},

   async deleteTicket(id, asset_id) {
  if (!confirm('Close this ticket?')) return;

  try {
    // 1️⃣ Kunin muna ang ticket bago idelete
    const { data: ticketData, error: fetchErr } = await this.db
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single(); // kukunin lang 1 row

    if (fetchErr) throw fetchErr;

    // 2️⃣ I-save sa Closed_Tickets
    const { error: insertErr } = await this.db
      .from('closed_tickets')   // lowercase
      .insert([{
        sn: ticketData.sn,
        item_name: ticketData.item_name,
        user_name: ticketData.user_name,
        description: ticketData.description,
        status: ticketData.status,
        asset_id: ticketData.asset_id,
        created_at: ticketData.created_at,
        updated_at: ticketData.updated_at
      }]);

    if (insertErr) throw insertErr;

    // 3️⃣ I-delete sa original tickets table
    const { error: delErr } = await this.db
      .from('tickets')
      .delete()
      .eq('id', id);

    if (delErr) throw delErr;

    // 4️⃣ UPDATE asset status to match ticket status
    if (asset_id) {
      const { error: assetErr } = await this.db
        .from('assets')
        .update({ status: ticketData.status }) // <-- use ticket status
        .eq('id', asset_id);
      if (assetErr) throw assetErr;
    }

    await this.loadTickets();
    alert('Ticket closed');

  } catch (err) {
    console.error(err);
    alert('Close failed: ' + err.message);
  }
},


    statusClass(status) {
      return {
        'Deployed': 'bg-green-100 text-green-700',
        'Available': 'bg-blue-100 text-blue-700',
        'Maintenance': 'bg-amber-100 text-amber-700',
        'Disposed': 'bg-rose-100 text-rose-700',
        'For repair': 'bg-orange-100 text-orange-700',
        'Replacement': 'bg-purple-100 text-purple-700',
        'Pending': 'bg-yellow-100 text-yellow-700',
        'In Progress': 'bg-indigo-100 text-indigo-700',
        'Resolved': 'bg-emerald-100 text-emerald-700'
      }[status] || 'bg-slate-100 text-slate-700';
    }
  }
}