function accountsApp() {
  return {
    db: null,
    users: [],
    filteredUsers: [],
    searchQuery: '',
    showModal: false,
    editMode: false,

    currentUser: { id: null, username: '', email: '', role: '' },
    password: '',
    confirmPassword: '',
    mustChangePassword: true,

    isAdmin: localStorage.getItem('userRole') === 'Administrator',

    async init() {
      const supabaseUrl = 'https://kjgsdcbehsmspadyauhc.supabase.co';
      const supabaseKey = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
      this.db = supabase.createClient(supabaseUrl, supabaseKey);

      await this.loadUsers();

      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
      });
    },

    // Current date ng PC
    get currentDate() {
      const now = new Date();
      return now.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    },
    

    async loadUsers() {
      const { data, error } = await this.db
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      this.users = data || [];
      this.filterUsers();

      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
      });
      
    },

    filterUsers() {
      const q = this.searchQuery.toLowerCase();
      if (!q) {
        this.filteredUsers = this.users;
        if (window.lucide) {
        setTimeout(() => {
            window.lucide.createIcons();
        }, 0);
    }
        return;
      }

      this.filteredUsers = this.users.filter(u =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
      );
    },

    // =========================
    // MODAL CONTROLS
    // =========================

  openModal() {
  // ADD MODE
  this.editMode = false; // ✅ TAMA
  this.currentUser = { id: null, username: '', email: '', role: '' };
  this.password = '';
  this.confirmPassword = '';
  this.mustChangePassword = true;
  this.showModal = true;
},


    editUser(user) {
      // EDIT MODE
      this.editMode = true;
      this.currentUser = { ...user }; // id is preserved
      this.password = '';
      this.confirmPassword = '';
      this.mustChangePassword = false;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    // =========================
    // SAVE USER
    // =========================

    async saveUser() {
      if (!this.currentUser.username || !this.currentUser.email || !this.currentUser.role) {
        alert('All fields are required');
        return;
      }

      const hashPassword = async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      };

      // =========================
      // ADD USER
      // =========================
      if (!this.editMode) {
        if (!this.password || this.password !== this.confirmPassword) {
          alert('Passwords do not match or are empty');
          return;
        }

        const hashedPassword = await hashPassword(this.password);

        const { error } = await this.db.from('users').insert([{
          username: this.currentUser.username,
          email: this.currentUser.email,
          role: this.currentUser.role,
          password: hashedPassword,
          must_change_password: this.mustChangePassword
        }]);

        if (error) {
          alert('Failed to add user: ' + error.message);
          return;
        }
      }

      // =========================
      // EDIT USER
      // =========================
      else {
        if (!this.currentUser.id) {
          alert('Invalid user ID');
          return;
        }

        const updateData = {
          username: this.currentUser.username,
          email: this.currentUser.email,
          role: this.currentUser.role,
          must_change_password: this.mustChangePassword
        };

        if (this.password) {
          if (this.password !== this.confirmPassword) {
            alert('Passwords do not match');
            return;
          }
          updateData.password = await hashPassword(this.password);
        }

        const { error } = await this.db
          .from('users')
          .update(updateData)
          .eq('id', this.currentUser.id);

        if (error) {
          alert('Failed to update user: ' + error.message);
          return;
        }
      }

      this.closeModal();
      await this.loadUsers();
      this.password = '';
      this.confirmPassword = '';
    },

    // =========================
    // DELETE USER
    // =========================

    async deleteUser(id) {
      if (!confirm('Are you sure you want to delete this user?')) return;

      const { error } = await this.db
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Failed to delete user: ' + error.message);
        return;
      }

      await this.loadUsers();
    }
  };
}
