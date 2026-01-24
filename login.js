// Supabase credentials
const SUPABASE_URL = 'https://kjgsdcbehsmspadyauhc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.authApp = () => ({
  username: '',
  password: '',
  showModal: false,
  newPassword: '',
  confirmPassword: '',
  currentUser: null,

  // SHA-256 hash helper
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Login flow
  async login() {
    if (!this.username || !this.password) {
      alert('❌ Enter username and password.');
      return;
    }

    try {
      const hashedPassword = await this.hashPassword(this.password);

      const { data: user, error } = await supabaseClient
        .from('users')
        .select('id, username, role, password, must_change_password')
        .eq('username', this.username)
        .maybeSingle();

      if (error) throw error;
      if (!user || hashedPassword !== user.password) {
        alert('❌ Invalid username or password.');
        return;
      }

      this.currentUser = user;

      if (user.must_change_password) {
        this.showModal = true; // force password change
        return;
      }

      await this.completeLogin(user);

    } catch (err) {
      console.error(err);
      alert('❌ Connection error. Check console.');
    }
  },

  // Change password flow
  async changePassword() {
    if (!this.newPassword || !this.confirmPassword) {
      return alert('❌ Fill in all fields.');
    }
    if (this.newPassword !== this.confirmPassword) {
      return alert('❌ Passwords do not match.');
    }
    if (this.newPassword.length < 6) {
      return alert('❌ Password must be at least 6 characters.');
    }

    try {
      const hashedNewPassword = await this.hashPassword(this.newPassword);

      const { error } = await supabaseClient
        .from('users')
        .update({ password: hashedNewPassword, must_change_password: false })
        .eq('id', this.currentUser.id);

      if (error) throw error;

      // Alert before redirect
      alert(`✅ Password changed successfully! Welcome back, ${this.currentUser.username}!`);

      // Save session
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', this.currentUser.id);
      localStorage.setItem('userName', this.currentUser.username);
      localStorage.setItem('userRole', this.currentUser.role);

      // Redirect based on role
      if (this.currentUser.role.toLowerCase() === 'administrator') {
        window.location.href = 'index.html';
      } else {
        window.location.href = 'tickets.html';
      }

      // Reset modal & inputs
      this.showModal = false;
      this.username = '';
      this.password = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.currentUser = null;

    } catch (err) {
      console.error(err);
      alert('❌ Failed to update password.');
    }
  },

  // Complete login for normal flow
async completeLogin(user) {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userId', user.id);
  localStorage.setItem('userName', user.username);
  localStorage.setItem('userRole', user.role);

  // LOGGING - Hintayin itong matapos bago ang alert/redirect
   let userIp = "Unknown";

  // Array ng mga libreng IP APIs para sa redundancy
  const ipProviders = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co',
    'https://api.seeip.org'
  ];

  for (const url of ipProviders) {
    try {
      const response = await fetch(url, { timeout: 3000 }); // 3 seconds timeout
      const data = await response.json();
      userIp = data.ip || data.query; // ipapi.co uses 'ip', others use 'ip' or 'query'
      if (userIp) break; // Kapag nakakuha na, stop na sa loop
    } catch (e) {
      console.warn(`Failed to fetch IP from ${url}`);
    }
  }

  // I-save ang Log sa Supabase
  const { error: logError } = await supabaseClient
    .from('logs')
    .insert([{
      user_id: user.id,
      username: user.username,
      role: user.role,
      action: 'LOGIN',
      module: 'AUTH',
      ip_address: userIp
    }]);

  // Rest of your redirect logic...
  alert(`✅ Welcome back, ${user.username}! IP: ${userIp}`);
  window.location.href = user.role.toLowerCase() === 'administrator' ? 'index.html' : 'tickets.html';
},
  cancelChange() {
    this.showModal = false;
    this.newPassword = '';
    this.confirmPassword = '';
    this.currentUser = null;
  }
});

// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
});