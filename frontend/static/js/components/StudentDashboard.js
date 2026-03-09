const StudentDashboard = {
    name: 'StudentDashboard',
    template: `
    <div>
        <div class="dashboard-header">
            <div class="container">
                <h2><i class="bi bi-mortarboard"></i> Student Dashboard</h2>
                <p class="mb-0 opacity-75">Welcome, [[ student.name || 'Student' ]]</p>
            </div>
        </div>
        <div class="container py-4 fade-in">
            <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
            <template v-else>
                <div class="row g-4 mb-4">
                    <div class="col-md-4 col-6" v-for="card in statCards" :key="card.label">
                        <div class="card stat-card" :class="'border-' + card.color">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="stat-value" :class="'text-' + card.color">[[ card.value ]]</div>
                                    <div class="stat-label">[[ card.label ]]</div>
                                </div>
                                <i :class="card.icon + ' stat-icon text-' + card.color"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row g-4">
                    <div class="col-md-3">
                        <div class="card shadow-sm p-4 h-100">
                            <h5 class="fw-bold mb-3"><i class="bi bi-search text-primary"></i> Find Jobs</h5>
                            <p class="text-muted">Browse and apply for placement opportunities</p>
                            <router-link to="/jobs" class="btn btn-primary"><i class="bi bi-briefcase"></i> Browse Jobs</router-link>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card shadow-sm p-4 h-100">
                            <h5 class="fw-bold mb-3"><i class="bi bi-file-earmark-text text-info"></i> Applications</h5>
                            <p class="text-muted">Track your job applications and status</p>
                            <router-link to="/student/applications" class="btn btn-outline-info"><i class="bi bi-list-check"></i> View Applications</router-link>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card shadow-sm p-4 h-100">
                            <h5 class="fw-bold mb-3"><i class="bi bi-person text-success"></i> My Profile</h5>
                            <p class="text-muted">Update your profile, skills, and resume</p>
                            <router-link to="/student/profile" class="btn btn-outline-success"><i class="bi bi-pencil"></i> Edit Profile</router-link>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card shadow-sm p-4 h-100">
                            <h5 class="fw-bold mb-3"><i class="bi bi-trophy text-warning"></i> Placements</h5>
                            <p class="text-muted">View your placement history</p>
                            <router-link to="/student/placements" class="btn btn-outline-warning"><i class="bi bi-award"></i> View History</router-link>
                        </div>
                    </div>
                </div>
                <div class="row g-4 mt-1">
                    <div class="col-md-6">
                        <div class="card shadow-sm p-4">
                            <h5 class="fw-bold mb-3"><i class="bi bi-download text-secondary"></i> Export Data</h5>
                            <button class="btn btn-outline-secondary" @click="exportApps" :disabled="exporting">
                                <span v-if="exporting" class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="bi bi-filetype-csv me-1"></i> Export My Applications (CSV)
                            </button>
                            <div v-if="exportMsg" class="alert mt-2 mb-0" :class="exportMsgClass">[[ exportMsg ]]</div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return {
            stats: {}, student: {}, loading: true,
            exporting: false, exportMsg: '', exportMsgClass: 'alert-info',
            taskPollInterval: null
        };
    },
    computed: {
        statCards() {
            const s = this.stats;
            return [
                { value: s.total_applications || 0, label: 'Applications', color: 'primary', icon: 'bi bi-file-earmark-text-fill' },
                { value: s.shortlisted || 0, label: 'Shortlisted', color: 'warning', icon: 'bi bi-star-fill' },
                { value: s.interviews || 0, label: 'Interviews', color: 'info', icon: 'bi bi-calendar-event-fill' },
                { value: s.offers || 0, label: 'Offers', color: 'success', icon: 'bi bi-trophy-fill' },
                { value: s.placements || 0, label: 'Placements', color: 'secondary', icon: 'bi bi-award-fill' },
            ];
        }
    },
    methods: {
        async fetchDashboard() {
            this.loading = true;
            try {
                const res = await api.studentDashboard();
                this.stats = res.stats;
                this.student = res.student;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async exportApps() {
            this.exporting = true;
            this.exportMsg = 'Starting export...';
            this.exportMsgClass = 'alert-info';
            try {
                const res = await api.exportApplications();
                if (res.task_id) {
                    this.exportMsg = 'Export in progress...';
                    this.taskPollInterval = setInterval(async () => {
                        try {
                            const r = await api.checkTaskStatus(res.task_id);
                            if (r.status === 'SUCCESS') {
                                clearInterval(this.taskPollInterval);
                                this.exportMsg = 'Export complete!';
                                this.exportMsgClass = 'alert-success';
                                this.exporting = false;
                                if (r.result && r.result.file) window.open(api.downloadExportUrl(r.result.file), '_blank');
                            } else if (r.status === 'FAILURE') {
                                clearInterval(this.taskPollInterval);
                                this.exportMsg = 'Export failed.';
                                this.exportMsgClass = 'alert-danger';
                                this.exporting = false;
                            }
                        } catch (err) {
                            clearInterval(this.taskPollInterval);
                            this.exportMsg = 'Could not check status.';
                            this.exportMsgClass = 'alert-warning';
                            this.exporting = false;
                        }
                    }, 2000);
                } else {
                    this.exportMsg = 'Export completed!';
                    this.exportMsgClass = 'alert-success';
                    this.exporting = false;
                }
            } catch (err) {
                this.exportMsg = err.message || 'Export failed.';
                this.exportMsgClass = 'alert-danger';
                this.exporting = false;
            }
        }
    },
    mounted() { this.fetchDashboard(); },
    beforeUnmount() { if (this.taskPollInterval) clearInterval(this.taskPollInterval); }
};
