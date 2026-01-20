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

    // Kunin ang role mula sa localStorage para sa UI control
    isAdmin: localStorage.getItem('userRole') === 'Administrator',

    async init() {
      // Initialize Supabase
      const supabaseUrl = 'https://kjgsdcbehsmspadyauhc.supabase.co';
      const supabaseKey = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
      this.db = supabase.createClient(supabaseUrl, supabaseKey);

      await this.loadUsers();
      
      // I-initialize ang icons sa start
      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
      });
    },

    async loadUsers() {
      const { data, error } = await this.db.from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        this.users = data || [];
        this.filterUsers(); // I-refresh ang listahan sa screen
      } else {
        console.error('Error loading users:', error);
      }
      
      // Re-run lucide icons pagkatapos mag-render ng table rows
      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
      });
    },

    filterUsers() {
      const q = this.searchQuery.toLowerCase();
      if (q === '') {
        this.filteredUsers = this.users;
      } else {
        this.filteredUsers = this.users.filter(u =>
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q))
        );
      }
    },

    openModal() {
      this.editMode = true;
      this.currentUser = { id: null, username: '', email: '', role: '' };
      this.password = '';
      this.confirmPassword = '';
      this.mustChangePassword = true;
      this.showModal = true;
    },

    editUser(user) {
      this.editMode = true;
      this.currentUser = { ...user };
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    async saveUser() {
      // 1️⃣ Validation
      if (!this.currentUser.username || !this.currentUser.email || !this.currentUser.role) {
        alert('All fields are required');
        return;
      }

      // 2️⃣ Add New User Mode
      if (!this.editMode) {
        if (!this.password || this.password !== this.confirmPassword) {
          alert('Passwords do not match or are empty');
          return;
        }

        // 🔐 Hash the password using SHA-256
        const hashedPassword = await (async (password) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(password);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        })(this.password);

        // 3️⃣ Insert new user into Supabase
        const { data, error } = await this.db.from('users').insert([{
          username: this.currentUser.username,
          email: this.currentUser.email,
          role: this.currentUser.role,
          password: hashedPassword,
          must_change_password: this.mustChangePassword
        }]);

        if (error) {
          console.error('Error adding user:', error);
          alert('Failed to add user: ' + error.message);
          return;
        }
      } 
      // 4️⃣ Edit Existing User Mode
      else {
        
        // 🔐 Hash the password using SHA-256
        const hashedPassword = await (async (password) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(password);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        })(this.password);
        const { error } = await this.db.from('users')
          .update({
            username: this.currentUser.username,
            email: this.currentUser.email,
            role: this.currentUser.role,
              password: hashedPassword,
          must_change_password: this.mustChangePassword
          })
          .eq('id', this.currentUser.id);

        if (error) {
          console.error('Error updating user:', error);
          alert('Failed to update user: ' + error.message);
          return;
        }
      }

      // Success feedback
      this.closeModal();
      await this.loadUsers();
      this.password = '';
      this.confirmPassword = '';
    },

    async deleteUser(id) {
      if (!confirm('Are you sure you want to delete this user?')) return;

      const { error } = await this.db.from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user: ' + error.message);
      } else {
        await this.loadUsers();
      }
    }
  };
}

