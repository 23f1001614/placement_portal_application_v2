const AdminJobs = {
    name: 'AdminJobs',
    template: `
    <div class="container py-4 fade-in">
        <div class="section-header">
            <h4><i class="bi bi-briefcase"></i> Manage Job Postings</h4>
        </div>
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="search-bar">
                    <i class="bi bi-search search-icon"></i>
                    <input type="text" class="form-control" v-model="search" placeholder="Search jobs..."
                        @input="fetchJobs">
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" v-model="statusFilter" @change="fetchJobs">
                    <option value="">All</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                </select>
            </div>
        </div>
        <div v-if="loading" class="loading-container">
            <div class="spinner-border spinner-custom" role="status"></div>
        </div>
        <div v-else-if="jobs.length === 0" class="empty-state">
            <i class="bi bi-briefcase"></i>
            <h5>No jobs found</h5>
        </div>
        <div v-else class="table-responsive">
            <table class="table table-custom">
                <thead>
                    <tr><th>Title</th><th>Company</th><th>Salary</th><th>Status</th><th>Approved</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    <tr v-for="j in jobs" :key="j.id">
                        <td class="fw-semibold">[[ j.title ]]</td>
                        <td>[[ j.company_name || '—' ]]</td>
                        <td>[[ j.salary_min || '—' ]] - [[ j.salary_max || '—' ]]</td>
                        <td><span class="badge badge-status" :class="'badge-' + j.status">[[ j.status ]]</span></td>
                        <td>
                            <span class="badge badge-status" :class="j.is_approved ? 'badge-approved' : 'badge-pending'">
                                [[ j.is_approved ? 'Yes' : 'Pending' ]]
                            </span>
                        </td>
                        <td>
                            <button v-if="!j.is_approved" class="btn btn-sm btn-success me-1" @click="approve(j.id)">
                                <i class="bi bi-check-lg"></i> Approve
                            </button>
                            <button class="btn btn-sm btn-outline-danger" @click="remove(j.id)">
                                <i class="bi bi-trash"></i> Remove
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
        return { jobs: [], loading: true, search: '', statusFilter: '' };
    },
    methods: {
        async fetchJobs() {
            this.loading = true;
            try {
                let params = '?';
                if (this.search) params += `search=${this.search}&`;
                if (this.statusFilter) params += `status=${this.statusFilter}&`;
                const res = await api.adminJobs(params);
                this.jobs = res.jobs;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async approve(id) { await api.approveJob(id); this.fetchJobs(); },
        async remove(id) { if (confirm('Remove job?')) { await api.removeJob(id); this.fetchJobs(); } }
    },
    mounted() { this.fetchJobs(); }
};
