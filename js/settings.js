function settingsApp() {
  return {
    db: null,
    isAdmin: localStorage.getItem('userRole') === 'Administrator',

    settings: {
      systemName: 'AssetPro',
      emailNotifications: true,
      maintenance: false,
      defaultRole: 'User',
      strongPassword: true,
      twoFA: false,
      sessionTimeout: 30,
      assetPrefix: 'AST-',
      autoAssetCode: true,
      assetApproval: false,
      ticketAutoClose: 7,
      defaultPriority: 'Medium',
      reopenTicket: true
    },

    async init() {
      if (!this.isAdmin) { alert('Admin only'); return; }

      this.db = supabase.createClient(
        'https://kjgsdcbehsmspadyauhc.supabase.co',
        'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy'
      );

      // Load settings from DB
      const { data, error } = await this.db.from('settings').select('data').eq('id', 1).single();
      if (error) console.error('Load error:', error);
      if (data?.data) this.settings = { ...this.settings, ...data.data };

      // Initialize icons
      lucide.createIcons();
    },

    async saveSettings() {
      const { error } = await this.db.from('settings')
        .upsert({ id:1, data: this.settings, updated_at: new Date() });
      if (error) { alert('Failed to save settings'); console.error(error); }
      else alert('Settings saved!');
    },

    resetDefaults() {
      if (!confirm('Reset all settings to default?')) return;
      this.settings = {
        systemName: 'AssetPro',
        emailNotifications: true,
        maintenance: false,
        defaultRole: 'User',
        strongPassword: true,
        twoFA: false,
        sessionTimeout: 30,
        assetPrefix: 'AST-',
        autoAssetCode: true,
        assetApproval: false,
        ticketAutoClose: 7,
        defaultPriority: 'Medium',
        reopenTicket: true
      };
    },

    forceLogout() {
      alert('Force logout simulated (backend logic required)');
      // Optional: you can create a DB flag "force_logout": true to implement in app
    }
  }
}