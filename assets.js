 const SUPABASE_URL = 'https://kjgsdcbehsmspadyauhc.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        document.addEventListener('alpine:init', () => {
  Alpine.data('userAutocomplete', (parentAsset = { user_name: '' }) => ({
    users: [],
    filteredUsers: [],
    currentAsset: parentAsset,

    async init() {
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, username')
            .order('username', { ascending: true });
        if (error) return console.error('Failed to fetch users:', error);
        this.users = data;
    },

    filterUsers(e) {
        const query = e.target.value.toLowerCase();
        this.filteredUsers = this.users.filter(u => u.username.toLowerCase().includes(query));
    },

    selectUser(username) {
        this.currentAsset.user_name = username; // direktang assign sa parent
        this.filteredUsers = [];
    }
}));


            Alpine.data('assetApp', () => ({
                assets: [],
                showAddModal: false,
                editMode: false,
                searchQuery: '',
                filterCategory: '',
                filterStatus: '',
                
                currentAsset: { id: null, name: '', sn: '', category: '', user_name: '', status: 'Available' },
    // CONFIRM MODAL OBJECT
        confirmModal: {
            show: false,
            type: 'delete',
            title: '',
            message: '',
            onConfirm: () => {}
        },
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
   
// Sa assets.js assetApp init()
const urlParams = new URLSearchParams(window.location.search);
const statusFromUrl = urlParams.get('status');
if (statusFromUrl) {
    this.filterStatus = statusFromUrl; // Ito dapat ang variable sa x-model ng dropdown mo
}


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
                    if (!loggedIn) window.location.href = 'login.html';
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
            .limit(100000); // Siguraduhin na lalampas sa 5 ang loading

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
    this.confirmModal = {
        show: true,
        type: 'save',
        title: this.editMode ? 'Confirm Update' : 'Confirm Save',
        message: this.editMode
            ? `Are you sure you want to update asset: ${this.currentAsset.name}?`
            : `Are you sure you want to save new asset: ${this.currentAsset.name}?`,
        onConfirm: async () => {
            const username = localStorage.getItem('userName');
            const role = localStorage.getItem('userRole');
            let ip = 'Unknown';
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                ip = (await ipRes.json()).ip;
            } catch { }

           if (this.editMode) {
    const oldAsset = this.assets.find(a => a.id === this.currentAsset.id);

    // 1️⃣ Update the asset itself
    const { error: assetErr } = await supabaseClient
        .from('assets')
        .update({
            name: this.currentAsset.name,
            sn: this.currentAsset.sn,
            category: this.currentAsset.category,
            user_name: this.currentAsset.user_name,
            status: this.currentAsset.status
        })
        .eq('id', this.currentAsset.id)
        .select();
    if (assetErr) return console.error('Update asset error:', assetErr);

    // 2️⃣ Update tickets by SN
    const { data: updatedTickets, error: ticketErr } = await supabaseClient
        .from('tickets')
        .update({ status: this.currentAsset.status })
        .eq('sn', this.currentAsset.sn) // ✅ Use SN instead of asset_id
        .select();
    if (ticketErr) console.error('Update tickets error:', ticketErr);

    console.log('Tickets updated:', updatedTickets);

    // 3️⃣ Log the action
    await supabaseClient.from('logs').insert([{
        username,
        role,
        action: `User ${username} UPDATED asset: ${oldAsset.name} (${oldAsset.sn}) → ${this.currentAsset.name} (${this.currentAsset.sn}), Status: ${oldAsset.status} → ${this.currentAsset.status}`,
        module: 'ASSETS',
        ip_address: ip
    }]);
}

else {
                const { data, error } = await supabaseClient
                    .from('assets')
                    .insert([this.currentAsset])
                    .select();

                if (error) return console.error('Insert asset error:', error);

                await supabaseClient.from('logs').insert([{
                    username, role,
                    action: `User ${username} ADDED asset: ${data[0].name} (${data[0].sn}), Status: ${data[0].status}`,
                    module: 'ASSETS',
                    ip_address: ip
                }]);
            }

            this.currentAsset = { id: null, name: '', sn: '', category: '', user_name: '', status: 'Available' };
            this.showAddModal = false;
            this.editMode = false;
            await this.loadAssets();
        }
    };
},


               deleteAsset(asset) {
    this.confirmModal = {
        show: true,
        type: 'delete',
        title: 'Confirm Delete',
        message: `Are you sure you want to delete asset: ${asset.name}?`,
        onConfirm: async () => {
            const username = localStorage.getItem('userName');
            const role = localStorage.getItem('userRole');
            let ip = 'Unknown';
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                ip = (await ipRes.json()).ip;
            } catch { }

            const { error } = await supabaseClient.from('assets').delete().eq('id', asset.id);
            if (error) return console.error('Delete asset error:', error);

            await supabaseClient.from('logs').insert([{
                username, role,
                action: `User ${username} DELETED asset: ${asset.name} (${asset.sn}), Status: ${asset.status}`,
                module: 'ASSETS',
                ip_address: ip
            }]);

            await this.loadAssets();
        }
    };
},
async exportToCSV() {
    if (this.assets.length === 0) return alert('No data to export');
    
    // 1. Gawin ang Export process
    const headers = ['name', 'sn', 'category', 'user_name', 'status'];
    const rows = this.assets.map(a => [
        `"${a.name || ''}"`, `"${a.sn || ''}"`, `"${a.category || ''}"`, `"${a.user_name || ''}"`, `"${a.status || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Inventory_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. LOGGING - Itala ang export action
    try {
        const username = localStorage.getItem('userName');
        const role = localStorage.getItem('userRole');
        let ip = 'Unknown';
        try {
            const ipRes = await fetch('https://api.ipify.org');
            ip = (await ipRes.json()).ip;
        } catch { }

        await supabaseClient.from('logs').insert([{
            username,
            role,
            action: `User ${username} EXPORTED ${this.assets.length} assets to CSV`,
            module: 'ASSETS',
            ip_address: ip
        }]);
    } catch (logErr) {
        console.warn('Logging failed:', logErr);
    }
},

async importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const rows = e.target.result.split("\n").filter(row => row.trim() !== "").slice(1);
            const importedData = rows.map(row => {
                const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                return cols.length >= 5 ? {
                    name: cols[0].replace(/"/g, '').trim(),
                    sn: cols[1].replace(/"/g, '').trim(),
                    category: cols[2].replace(/"/g, '').trim(),
                    user_name: cols[3].replace(/"/g, '').trim(),
                    status: cols[4].replace(/"/g, '').trim()
                } : null;
            }).filter(item => item !== null && item.name !== "");

            if (importedData.length === 0) throw new Error("Invalid CSV format or empty file.");
            if (!confirm(`Import ${importedData.length} items and auto-create users?`))return;

            // --- STEP 1: AUTO-CREATE USERS LOGIC ---
            const uniqueUsernames = [...new Set(importedData.map(d => d.user_name))]
                .filter(u => u && u !== "Available" && u !== "" && u.toLowerCase() !== "none");

            if (uniqueUsernames.length > 0) {
                // Check kung sino na ang existing
                const { data: existingUsers } = await supabaseClient
                    .from('users')
                    .select('username')
                    .in('username', uniqueUsernames);

                const existingList = (existingUsers || []).map(u => u.username);
                const newUsersToCreate = uniqueUsernames.filter(u => !existingList.includes(u));

                if (newUsersToCreate.length > 0) {
                    // HELPER: Manu-manong hash para sa default password '123456'
                    const encoder = new TextEncoder();
                    const data = encoder.encode('123456');
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashedDefaultPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                 // Hanapin ang part na ito sa iyong importFromCSV function:
const usersToInsert = newUsersToCreate.map(u => ({
    username: u,
    email: `${u.toLowerCase()}@system.local`, // <--- Idagdag ito para ma-satisfy ang database
    password: hashedDefaultPassword,
    role: 'User',
    must_change_password: true
}));

                    const { error: userErr } = await supabaseClient.from('users').insert(usersToInsert);
                    if (userErr) console.warn('User auto-creation failed:', userErr.message);
                }
            }

            // --- STEP 2: INSERT ASSETS ---
            const { error: assetErr } = await supabaseClient.from('assets').insert(importedData);
            if (assetErr) throw assetErr;

            // --- STEP 3: LOGGING ---
            try {
                const username = localStorage.getItem('userName');
                const role = localStorage.getItem('userRole');
                let ip = 'Unknown';
                try {
                    const ipRes = await fetch('https://api.ipify.org');
                    ip = (await ipRes.json()).ip;
                } catch { }

                await supabaseClient.from('logs').insert([{
                    username,
                    role,
                    action: `User ${username} IMPORTED ${importedData.length} assets and created ${uniqueUsernames.length} users`,
                    module: 'ASSETS',
                    ip_address: ip
                }]);
            } catch (logErr) { console.warn('Logging failed:', logErr); }

            alert('✅ Success! Assets imported and missing users created (Pass: 123456).');
            await this.loadAssets(); 
        } catch (err) {
            console.error(err);
            alert('❌ Error: ' + err.message);
        }
        event.target.value = ''; 
    };
    reader.readAsText(file);
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

         