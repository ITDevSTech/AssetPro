 const SUPABASE_URL = 'https://kjgsdcbehsmspadyauhc.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        document.addEventListener('alpine:init', () => {
            Alpine.data('assetApp', () => ({
                assets: [],
                showAddModal: false,
                editMode: false,
                searchQuery: '',
                filterCategory: '',
                filterStatus: '',
                currentAsset: { id: null, name: '', sn: '', category: '', user_name: '', status: 'Available' },

               get filteredAssets() {
    // 1. Gawin muna ang filtering logic
    const filtered = this.assets.filter(asset => {
        const matchSearch = (asset.name + (asset.sn || '') + (asset.user_name || ''))
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase());
        const matchCategory = this.filterCategory ? asset.category === this.filterCategory : true;
        const matchStatus = this.filterStatus ? asset.status === this.filterStatus : true;
        return matchSearch && matchCategory && matchStatus;
    });

    // 2. COMBINE: Bago ibalik ang data (return), utusan ang Lucide na mag-refresh
    // Gagamit tayo ng setTimeout(0) para hindi ma-block ang rendering ng table
    if (window.lucide) {
        setTimeout(() => {
            window.lucide.createIcons();
        }, 0);
    }

    // 3. Ibalik ang resulta
    return filtered;
},

                

                async init() {
                    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
                    if (!loggedIn) window.location.href = 'html/login.html';
                    await this.loadAssets();
                    
                },
async loadAssets() {
    this.loading = true; // Opsyonal: kung may loading state ka
    
    try {
        // 1. Kunin ang user info mula sa localStorage
        const userRole = localStorage.getItem('userRole');
        const userName = localStorage.getItem('userName');

        // 2. Simulan ang query
        let query = supabaseClient
            .from('assets')
            .select('*')
            .order('id', { ascending: false })
            .limit(1000); // Siguraduhin na lalampas sa 5 ang loading

        // 3. LOGIC: Kung HINDI Administrator, i-filter base sa pangalan ng user
        // Siguraduhin na 'user_name' ang eksaktong column name sa iyong 'assets' table
        if (userRole !== 'Administrator') {
            console.log(`Filtering assets for User: ${userName}`);
            query = query.eq('user_name', userName); 
        } else {
            console.log("Administrator detected: Loading all assets.");
        }

        const { data, error } = await query;

        if (error) throw error;

        // 4. I-assign ang data sa Alpine variable
        this.assets = data || [];
        console.log(`Successfully loaded ${this.assets.length} assets.`);

    } catch (err) {
        console.error('Load assets error:', err.message);
        // alert('Failed to load assets: ' + err.message);
    } finally {
        this.loading = false;
        // 5. I-refresh ang Lucide icons
        this.$nextTick(() => {
            if (window.lucide) lucide.createIcons();
        });
    }
},

                async saveAsset() {
                    const username = localStorage.getItem('userName');
                    const role = localStorage.getItem('userRole');

                    // Get IP
                    let ip = 'Unknown';
                    try {
                        const ipRes = await fetch('https://api.ipify.org?format=json');
                        ip = (await ipRes.json()).ip;
                    } catch { }

                    if (this.editMode) {
                        const oldAsset = this.assets.find(a => a.id === this.currentAsset.id);

                        const { error } = await supabaseClient
                            .from('assets')
                            .update({
                                name: this.currentAsset.name,
                                sn: this.currentAsset.sn,
                                category: this.currentAsset.category,
                                user_name: this.currentAsset.user_name,
                                status: this.currentAsset.status
                            })
                            .eq('id', this.currentAsset.id);

                        if (error) return console.error('Update asset error:', error);

                        await supabaseClient.from('logs').insert([{
                            username: username,
                            role: role,
                            action: `User ${username} UPDATED asset: ${oldAsset.name} (${oldAsset.sn}) → ${this.currentAsset.name} (${this.currentAsset.sn}), Status: ${oldAsset.status} → ${this.currentAsset.status}`,
                            module: 'ASSETS',
                            ip_address: ip
                        }]);

                    } else {
                        const { data, error } = await supabaseClient
                            .from('assets')
                            .insert([this.currentAsset])
                            .select();

                        if (error) return console.error('Insert asset error:', error);

                        await supabaseClient.from('logs').insert([{
                            username: username,
                            role: role,
                            action: `User ${username} ADDED asset: ${data[0].name} (${data[0].sn}), Status: ${data[0].status}`,
                            module: 'ASSETS',
                            ip_address: ip
                        }]);
                    }

                    this.currentAsset = { id: null, name: '', sn: '', category: '', user_name: '', status: 'Available' };
                    this.showAddModal = false;
                    this.editMode = false;
                    await this.loadAssets();
                },

                async deleteAsset(asset) {
                    const username = localStorage.getItem('userName');
                    const role = localStorage.getItem('userRole');

                    let ip = 'Unknown';
                    try {
                        const ipRes = await fetch('https://api.ipify.org?format=json');
                        ip = (await ipRes.json()).ip;
                    } catch { }

                    if (!confirm(`Are you sure you want to delete ${asset.name}?`)) return;

                    const { error } = await supabaseClient.from('assets').delete().eq('id', asset.id);
                    if (error) return console.error('Delete asset error:', error);

                    await supabaseClient.from('logs').insert([{
                        username: username,
                        role: role,
                        action: `User ${username} DELETED asset: ${asset.name} (${asset.sn}), Status: ${asset.status}`,
                        module: 'ASSETS',
                        ip_address: ip
                    }]);

                    await this.loadAssets();
                },

                editAsset(asset) {
                    this.currentAsset = { ...asset };
                    this.editMode = true;
                    this.showAddModal = true;
                },

             statusClass(status) {
    return {
        'Deployed': 'bg-green-100 text-green-700',
        'Available': 'bg-blue-100 text-blue-700',
        'Maintenance': 'bg-amber-100 text-amber-700',
        'Disposed': 'bg-rose-100 text-rose-700',
        
        // MGA DAGDAG NA STATUS:
        'For Repair': 'bg-orange-100 text-orange-700',
        'Replacement': 'bg-purple-100 text-purple-700'
    }[status] || 'bg-slate-100 text-slate-700';
}

                
                
            }));
        });

