const StudentApplications = {
    name: 'StudentApplications',
    template: `
    <div class="container py-4 fade-in">
        <div class="section-header"><h4><i class="bi bi-file-earmark-text"></i> My Applications</h4></div>
        <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
        <div v-else-if="applications.length === 0" class="empty-state">
            <i class="bi bi-file-earmark-text"></i>
            <h5>No applications yet</h5>
            <p><router-link to="/jobs">Browse jobs</router-link> and start applying!</p>
        </div>
        <div v-else class="table-responsive">
            <table class="table table-custom">
                <thead><tr><th>Job Title</th><th>Company</th><th>Applied Date</th><th>Status</th><th>Interview</th><th>Feedback</th></tr></thead>
                <tbody>
                    <tr v-for="a in applications" :key="a.id">
                        <td class="fw-semibold"><router-link :to="'/jobs/' + a.job_id">[[ a.job_title ]]</router-link></td>
                        <td>[[ a.company_name ]]</td>
                        <td>[[ formatDate(a.applied_date) ]]</td>
                        <td><span class="badge badge-status" :class="'badge-' + a.status">[[ a.status ]]</span></td>
                        <td>[[ a.interview_date ? a.interview_date + ' ' + (a.interview_time || '') : '—' ]]</td>
                        <td>[[ a.feedback || '—' ]]</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() { return { applications: [], loading: true }; },
    methods: {
        formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; },
        async fetchApplications() {
            this.loading = true;
            try {
                const res = await api.studentApplications();
                this.applications = res.applications;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        }
    },
    mounted() { this.fetchApplications(); }
};
