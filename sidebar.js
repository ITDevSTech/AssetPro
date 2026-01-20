 // 1. Initialize Supabase Client (Dapat nasa labas o global)
    const SUPABASE_URL = 'https://kjgsdcbehsmspadyauhc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    document.addEventListener('alpine:init', () => {
        Alpine.data('dashboardApp', () => ({
            // Dito ilalagay ang iyong mga variables (stats, lists, etc.)
            totalAssets: 0,
            deployed: 0,
            resolved: 0,
            // ... (ibang variables mo)

            // 2. Ang checkAndAutoDeploy function (Nasa loob na ng Alpine object)
            async checkAndAutoDeploy() {
                console.log("Checking for items to auto-deploy (2026 Live Sync)...");
                
                const { data: resolvedAssets, error } = await supabaseClient
                    .from('assets')
                    .select('id, updated_at')
                    .eq('status', 'Resolved');

                if (error) {
                    console.error("Auto-deploy fetch error:", error.message);
                    return;
                }

                if (!resolvedAssets || resolvedAssets.length === 0) return;

                const now = new Date();

                for (const asset of resolvedAssets) {
                    const lastUpdate = new Date(asset.updated_at);
                    const diffInMinutes = (now - lastUpdate) / 1000 / 60; 

                    if (diffInMinutes >= 5) {
                        console.log(`Asset #${asset.id} reached 5 mins. Updating to Deployed...`);
                        
                        const { error: updateError } = await supabaseClient
                            .from('assets')
                            .update({ 
                                status: 'Deployed',
                                updated_at: new Date().toISOString() 
                            })
                            .eq('id', asset.id);

                        if (updateError) {
                            console.error(`Failed to auto-deploy ${asset.id}:`, updateError.message);
                        } else {
                            console.log(`Successfully auto-deployed Asset #${asset.id}`);
                            // Tawagin ang iyong loadStats function para mag-update ang dashboard cards
                            this.loadStats(); 
                        }
                    }
                }
            },

            // 3. Ang loadStats function (Dapat nandito rin ito)
            async loadStats() {
                // Ilagay dito ang logic ng pag-fetch ng stats (Total, Deployed, etc.)
                // Halimbawa:
                const { count } = await supabaseClient.from('assets').select('*', { count: 'exact', head: true });
                this.totalAssets = count || 0;
            },

            // 4. Ang Init function
            init() {
                if (localStorage.getItem('isLoggedIn') !== 'true') {
                    window.location.href = 'login.html';
                    return;
                }
                
                // Unang load ng data
                this.loadStats();

                // Patakbuhin ang auto-check kada 1 minuto (60,000ms)
                setInterval(() => {
                    this.checkAndAutoDeploy();
                }, 60000);
            }
        }));
    });