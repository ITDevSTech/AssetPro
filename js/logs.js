document.addEventListener('alpine:init', () => {
    Alpine.data('logsApp', () => ({
        logs: [],
        loading: false,
        db: null,
        searchQuery: '',
        startDate: '',
        endDate: '',

        async init() {
            // Initialize Supabase
            this.db = supabase.createClient(
                'https://kjgsdcbehsmspadyauhc.supabase.co',
                'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy'
            );
            
            // Tawagin ang fetchLogs sa simula
            await this.fetchLogs();
        },

        async fetchLogs() {
            this.loading = true;
            try {
                // Simulan ang query sa logs table
                let query = this.db
                    .from('logs')
                    .select('*')
                    .order('created_at', { ascending: false });

                // SERVER-SIDE FILTER: Kung may nilagay na date, sa DB pa lang i-filter na
                // Ginagamit ang T00:00:00 para masigurado ang simula at dulo ng araw
                if (this.startDate) {
                    query = query.gte('created_at', this.startDate + 'T00:00:00Z');
                }
                if (this.endDate) {
                    query = query.lte('created_at', this.endDate + 'T23:59:59Z');
                }

                // MAHALAGA: Tumaas ang limit sa 1000 records
                // Kung wala itong .limit(), 1000 ang default ng Supabase
                const { data, error } = await query.limit(1000); 

                if (error) throw error;
                
                this.logs = data || [];
                console.log("Logs fetched:", this.logs.length); // I-check sa console kung ilan pumasok

            } catch (err) {
                console.error('Database Error:', err.message);
                alert('Error: ' + err.message);
            } finally {
                this.loading = false;
                // Re-render icons
                this.$nextTick(() => {
                    if (window.lucide) lucide.createIcons();
                });
            }
        },

        // Client-side filter para sa Quick Search box (Username/Action)
        filteredLogs() {
            if (!this.searchQuery) return this.logs;
            
            const q = this.searchQuery.toLowerCase();
            return this.logs.filter(log => 
                (log.username && log.username.toLowerCase().includes(q)) || 
                (log.action && log.action.toLowerCase().includes(q)) ||
                (log.module && log.module.toLowerCase().includes(q))
            );
        },

        formatDate(datetime) {
            if (!datetime) return 'N/A';
            return new Date(datetime).toLocaleString('en-PH', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    }));
});
