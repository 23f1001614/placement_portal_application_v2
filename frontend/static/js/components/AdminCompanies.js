const AdminCompanies = {
    name: 'AdminCompanies',
    template: `
    <div class="container py-4 fade-in">
        <div class="section-header">
            <h4><i class="bi bi-building"></i> Manage Companies</h4>
        </div>
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="search-bar">
                    <i class="bi bi-search search-icon"></i>
                    <input type="text" class="form-control" v-model="search" placeholder="Search companies..."
                        @input="fetchCompanies">
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" v-model="statusFilter" @change="fetchCompanies">
                    <option value="">All</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="blacklisted">Blacklisted</option>
                </select>
            </div>
        </div>
        <div v-if="loading" class="loading-container">
            <div class="spinner-border spinner-custom" role="status"></div>
        </div>
        <div v-else-if="companies.length === 0" class="empty-state">
            <i class="bi bi-building"></i>
            <h5>No companies found</h5>
        </div>
        <div v-else class="table-responsive">
            <table class="table table-custom">
                <thead>
                    <tr><th>Name</th><th>Industry</th><th>Location</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    <tr v-for="c in companies" :key="c.id">
                        <td class="fw-semibold">[[ c.name ]]</td>
                        <td>[[ c.industry || '—' ]]</td>
                        <td>[[ c.location || '—' ]]</td>
                        <td>
                            <span class="badge badge-status" :class="statusBadge(c)">[[ statusText(c) ]]</span>
                        </td>
                        <td>
                            <button v-if="!c.is_approved" class="btn btn-sm btn-success me-1" @click="approve(c.id)">
                                <i class="bi bi-check-lg"></i> Approve
                            </button>
                            <button class="btn btn-sm me-1" :class="c.is_blacklisted ? 'btn-outline-success' : 'btn-outline-danger'"
                                @click="blacklist(c.id)">
                                <i class="bi bi-shield-exclamation"></i> [[ c.is_blacklisted ? 'Unblock' : 'Blacklist' ]]
                            </button>
                            <button class="btn btn-sm btn-outline-danger" @click="remove(c.id)">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return { companies: [], loading: true, search: '', statusFilter: '' };
    },
    methods: {
        async fetchCompanies() {
            this.loading = true;
            try {
                let params = '?';
                if (this.search) params += `search=${this.search}&`;
                if (this.statusFilter) params += `status=${this.statusFilter}&`;
                const res = await api.adminCompanies(params);
                this.companies = res.companies;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async approve(id) { 
            // Optimistically update UI
            const company = this.companies.find(c => c.id === id);
            if (company) company.is_approved = true;
            
            try {
                await api.approveCompany(id);
                // Refresh after 500ms to get confirmed data
                setTimeout(() => this.fetchCompanies(), 500);
            } catch (err) {
                console.error(err);
                this.fetchCompanies(); // Revert on error
            }
        },
        async blacklist(id) { 
            // Optimistically update UI
            const company = this.companies.find(c => c.id === id);
            if (company) company.is_blacklisted = !company.is_blacklisted;
            
            try {
                await api.blacklistCompany(id);
                // Refresh after 500ms to get confirmed data
                setTimeout(() => this.fetchCompanies(), 500);
            } catch (err) {
                console.error(err);
                this.fetchCompanies(); // Revert on error
            }
        },
        async remove(id) { 
            if (confirm('Remove company?')) { 
                // Optimistically update UI
                this.companies = this.companies.filter(c => c.id !== id);
                
                try {
                    await api.removeCompany(id);
                } catch (err) {
                    console.error(err);
                    this.fetchCompanies(); // Revert on error
                }
            }
        },
        statusBadge(c) {
            if (c.is_blacklisted) return 'badge-blacklisted';
            if (c.is_approved) return 'badge-approved';
            return 'badge-pending';
        },
        statusText(c) {
            if (c.is_blacklisted) return 'Blacklisted';
            if (c.is_approved) return 'Approved';
            return 'Pending';
        }
    },
    mounted() { this.fetchCompanies(); }
};
