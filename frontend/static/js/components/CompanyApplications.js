const CompanyApplications = {
    name: 'CompanyApplications',
    template: `
    <div class="container py-4 fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="section-header mb-0"><h4><i class="bi bi-people"></i> Applicants for: [[ job.title || 'Job' ]]</h4></div>
            <router-link to="/company/jobs" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Jobs</router-link>
        </div>
        <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
        <div v-else-if="applications.length === 0" class="empty-state"><i class="bi bi-people"></i><h5>No applications yet</h5></div>
        <div v-else class="table-responsive">
            <table class="table table-custom">
                <thead><tr><th>Student Name</th><th>Skills</th><th>CGPA</th><th>Applied Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    <tr v-for="a in applications" :key="a.id">
                        <td class="fw-semibold">[[ a.student?.name || '—' ]]</td>
                        <td><span class="skill-tag" v-for="s in (a.student?.skills || '').split(',').slice(0,3)" :key="s">[[ s.trim() ]]</span></td>
                        <td>[[ a.student?.cgpa || '—' ]]</td>
                        <td>[[ formatDate(a.applied_date) ]]</td>
                        <td><span class="badge badge-status" :class="'badge-' + a.status">[[ a.status ]]</span></td>
                        <td>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">Update Status</button>
                                <ul class="dropdown-menu">
                                    <li v-for="s in statuses" :key="s"><a class="dropdown-item" href="#" @click.prevent="updateStatus(a.id, s)">[[ s.charAt(0).toUpperCase() + s.slice(1) ]]</a></li>
                                </ul>
                            </div>
                            <button v-if="a.status === 'shortlisted'" class="btn btn-sm btn-outline-info mt-1" @click="openSchedule(a.id)">
                                <i class="bi bi-calendar-plus"></i> Schedule
                            </button>
                            <button v-if="a.student?.resume_path" class="btn btn-sm btn-outline-secondary mt-1" @click="viewResume(a.id)">
                                <i class="bi bi-file-earmark-pdf"></i> Resume
                            </button>
                            <span v-else class="text-muted small d-block mt-1">No resume</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="modal fade" id="interviewModal" tabindex="-1">
            <div class="modal-dialog"><div class="modal-content">
                <div class="modal-header"><h5 class="modal-title">Schedule Interview</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <div class="mb-3"><label class="form-label fw-semibold">Interview Date</label><input type="date" class="form-control" v-model="interview.date"></div>
                    <div class="mb-3"><label class="form-label fw-semibold">Interview Time</label><input type="time" class="form-control" v-model="interview.time"></div>
                    <div class="mb-3"><label class="form-label fw-semibold">Feedback / Instructions</label><textarea class="form-control" v-model="interview.feedback" rows="2"></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button class="btn btn-primary" @click="scheduleInterview">Schedule</button>
                </div>
            </div></div>
        </div>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return {
            job: {}, applications: [], loading: true,
            statuses: ['applied', 'shortlisted', 'interview', 'offer', 'rejected', 'placed'],
            interview: { appId: null, date: '', time: '', feedback: '' }
        };
    },
    methods: {
        formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; },
        async fetchData() {
            this.loading = true;
            try {
                const res = await api.jobApplications(this.$route.params.jobId);
                this.job = res.job;
                this.applications = res.applications;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async updateStatus(appId, status) {
            await api.updateApplicationStatus(appId, { status });
            this.fetchData();
        },
        openSchedule(appId) {
            this.interview = { appId, date: '', time: '', feedback: '' };
            new bootstrap.Modal(document.getElementById('interviewModal')).show();
        },
        async scheduleInterview() {
            await api.updateApplicationStatus(this.interview.appId, {
                status: 'interview',
                interview_date: this.interview.date,
                interview_time: this.interview.time,
                feedback: this.interview.feedback
            });
            bootstrap.Modal.getInstance(document.getElementById('interviewModal')).hide();
            this.fetchData();
        },
        async viewResume(appId) {
            try {
                const url = api.viewResumeUrl(appId);
                const response = await fetch(url, { headers: { 'Authorization': 'Bearer ' + store.state.token } });
                if (!response.ok) { alert('Failed to load resume'); return; }
                const blob = await response.blob();
                window.open(URL.createObjectURL(blob), '_blank');
            } catch (err) { alert('Failed to load resume'); }
        }
    },
    mounted() { this.fetchData(); }
};
