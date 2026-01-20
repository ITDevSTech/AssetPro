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
      // Initialize Supabase client
      const supabaseUrl = 'https://kjgsdcbehsmspadyauhc.supabase.co';
      const supabaseKey = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
      this.db = supabase.createClient(supabaseUrl, supabaseKey);

      await this.loadUsers();

      // Initialize Lucide icons
      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
      });
    },

    async loadUsers() {
      const { data, error } = await this.db
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        this.users = data || [];
        this.filterUsers();
      } else {
        console.error('Error loading users:', error);
      }

      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
      });
    },

    filterUsers() {
      const q = this.searchQuery.toLowerCase();
      if (!q) {
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
      this.password = '';
      this.confirmPassword = '';
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },







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

      if (!this.editMode) {
        // Add user
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

     




      } else {
        // Edit user
        const hashedPassword = this.password ? await hashPassword(this.password) : undefined;

        const updateData = {
          username: this.currentUser.username,
          email: this.currentUser.email,
          role: this.currentUser.role,
          must_change_password: this.mustChangePassword
        };

        if (hashedPassword) updateData.password = hashedPassword;

        const { error } = await this.db.from('users')
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

    async deleteUser(id) {
      if (!confirm('Are you sure you want to delete this user?')) return;

      const { error } = await this.db.from('users')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Failed to delete user: ' + error.message);
      } else {
        
        await this.loadUsers();
      }
    }
    
  };
}

