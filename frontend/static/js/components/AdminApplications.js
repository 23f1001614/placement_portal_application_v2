const AdminApplications = {
    name: 'AdminApplications',
    template: `
    <div class="container py-4 fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="section-header mb-0"><h4><i class="bi bi-file-earmark-text"></i> All Student Applications</h4></div>
            <router-link to="/admin" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Dashboard</router-link>
        </div>
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="search-bar">
                    <i class="bi bi-search search-icon"></i>
                    <input type="text" class="form-control" v-model="search" placeholder="Search by student, job, or company..." @input="filterApps">
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" v-model="statusFilter" @change="filterApps">
                    <option value="">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="placed">Placed</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
        </div>
        <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
        <div v-else-if="filteredApps.length === 0" class="empty-state"><i class="bi bi-file-earmark-text"></i><h5>No applications found</h5></div>
        <div v-else class="table-responsive">
            <table class="table table-custom">
                <thead><tr><th>Student</th><th>Job Title</th><th>Company</th><th>Status</th><th>Applied Date</th><th>Interview</th><th>Feedback</th></tr></thead>
                <tbody>
                    <tr v-for="a in filteredApps" :key="a.id">
                        <td class="fw-semibold">[[ a.student_name || '—' ]]</td>
                        <td>[[ a.job_title || '—' ]]</td>
                        <td>[[ a.company_name || '—' ]]</td>
                        <td><span class="badge badge-status" :class="'badge-' + a.status">[[ a.status ]]</span></td>
                        <td>[[ formatDate(a.applied_date) ]]</td>
                        <td>[[ a.interview_date ? a.interview_date + ' ' + (a.interview_time || '') : '—' ]]</td>
                        <td>[[ a.feedback || '—' ]]</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return { applications: [], loading: true, search: '', statusFilter: '' };
    },
    computed: {
        filteredApps() {
            let apps = this.applications;
            if (this.statusFilter) apps = apps.filter(a => a.status === this.statusFilter);
            if (this.search) {
                const q = this.search.toLowerCase();
                apps = apps.filter(a => (a.student_name || '').toLowerCase().includes(q) || (a.job_title || '').toLowerCase().includes(q) || (a.company_name || '').toLowerCase().includes(q));
            }
            return apps;
        }
    },
    methods: {
        filterApps() { /* computed handles it */ },
        formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; },
        async fetchApplications() {
            this.loading = true;
            try {
                const res = await api.adminApplications();
                this.applications = res.applications;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        }
    },
    mounted() { this.fetchApplications(); }
};
