document.addEventListener('alpine:init', () => {
    Alpine.data('logsApp', () => ({
        logs: [],
        loading: false,
        db: null,
        searchQuery: '',
        startDate: '',
        endDate: '',
        limit: 10,        // rows per page
        page: 1,          // current page
        totalLogs: 0,     // total count for paging

        async init() {
            // Initialize Supabase
            this.db = supabase.createClient(
                'https://kjgsdcbehsmspadyauhc.supabase.co',
                'sb_publishable_rYCdnbva4YfBY0z5B0JiFg_Krw7KnYy'
            );

            await this.fetchLogs();
        },

        async fetchLogs() {
            this.loading = true;
            try {
                // Calculate range for paging
                const from = (this.page - 1) * this.limit;
                const to = from + this.limit - 1;

                let query = this.db
                    .from('logs')
                    .select('*', { count: 'exact' }) // to get total count
                    .order('created_at', { ascending: false })
                    .range(from, to);

                // Date filters
                if (this.startDate) query = query.gte('created_at', this.startDate + 'T00:00:00Z');
                if (this.endDate) query = query.lte('created_at', this.endDate + 'T23:59:59Z');

                const { data, count, error } = await query;
                if (error) throw error;

                this.logs = data || [];
                this.totalLogs = count || 0;

            } catch (err) {
                console.error('Database Error:', err.message);
                alert('Error: ' + err.message);
            } finally {
                this.loading = false;
                this.$nextTick(() => {
                    if (window.lucide) lucide.createIcons();
                });
            }
        },

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
        },

        // Paging functions
        nextPage() {
            if (this.page < Math.ceil(this.totalLogs / this.limit)) {
                this.page++;
                this.fetchLogs();
            }
        },

        prevPage() {
            if (this.page > 1) {
                this.page--;
                this.fetchLogs();
            }
        }
    }));
});
