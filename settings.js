function settingsApp() {
  return {
    db: null,
    isAdmin: localStorage.getItem('userRole') === 'Administrator',
    loading: false,

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
      // 1. Initialize Supabase
      const SUPABASE_URL = 'https://kjgsdcbehsmspadyauhc.supabase.co';
      const SUPABASE_KEY = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
      this.db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

      // 2. Security Check (Admin only)
      if (!this.isAdmin) { 
        alert('Access Denied: Administrators only.'); 
        window.location.href = '../index.html'; // Balik sa dashboard
        return; 
      }

      // 3. Load settings from DB
      await this.loadSettings();

      // Initialize icons pagkatapos mag-load ng data
      this.$nextTick(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
    },

    async loadSettings() {
      try {
        const { data, error } = await this.db
          .from('settings')
          .select('data')
          .eq('id', 1)
          .maybeSingle();

        if (error) throw error;
        if (data && data.data) {
          this.settings = { ...this.settings, ...data.data };
        }
      } catch (err) {
        console.error('Load error:', err.message);
      }
    },

    async saveSettings() {
      this.loading = true;
      try {
        const { error } = await this.db.from('settings')
          .upsert({ 
            id: 1, 
            data: this.settings, 
            updated_at: new Date().toISOString() 
          });

        if (error) throw error;
        alert('✅ Settings saved successfully!');
      } catch (err) {
        alert('Failed to save settings: ' + err.message);
      } finally {
        this.loading = false;
      }
    },

    // GLOBAL LOGOUT ALL USERS (2026 Logic)
    async forceLogout() {
      const confirmAction = confirm('WARNING: Sigurado ka bang gusto mong i-logout ang LAHAT ng users sa system? Mapipilitan silang mag-login ulit.');
      if (!confirmAction) return;

      try {
        const now = new Date().toISOString();

        // I-update ang lahat ng users sa database para magkaroon ng force logout timestamp
        // Ang .neq('id', 0) ay sinisiguro na lahat ng rows ay maaapektuhan
        const { error } = await this.db
          .from('users')
          .update({ force_logout_at: now })
          .neq('id', 0); 

        if (error) throw error;

        // I-log ang action na ito sa logs table
        await this.db.from('logs').insert([{
            user_id: localStorage.getItem('userId'),
            username: localStorage.getItem('userName'),
            role: 'Administrator',
            action: 'FORCE LOGOUT ALL SESSIONS',
            module: 'SETTINGS'
        }]);

        alert('✅ All sessions have been invalidated. Users will be logged out on their next action.');

      } catch (err) {
        console.error('Logout Error:', err.message);
        alert('Failed to execute logout: ' + err.message);
      }
    },

    resetDefaults() {
      if (!confirm('Reset all settings to factory default?')) return;
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
      alert('Settings reset to defaults. Click "Save" to apply.');
    }
  }
}
