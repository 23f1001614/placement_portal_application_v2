const AdminDashboard = {
    name: 'AdminDashboard',
    template: `
    <div>
        <div class="dashboard-header">
            <div class="container">
                <h2><i class="bi bi-speedometer2"></i> Admin Dashboard</h2>
                <p class="mb-0 opacity-75">Welcome back, Administrator</p>
            </div>
        </div>
        <div class="container py-4 fade-in">
            <div v-if="loading" class="loading-container">
                <div class="spinner-border spinner-custom" role="status"></div>
            </div>
            <template v-else>
                <div class="row g-4 mb-4">
                    <div class="col-md-3 col-6" v-for="card in statCards" :key="card.label">
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
                    <div class="col-md-6">
                        <div class="card shadow-sm p-4">
                            <h5 class="fw-bold mb-3"><i class="bi bi-clock-history text-warning"></i> Pending Approvals</h5>
                            <div class="d-flex justify-content-between mb-2">
                                <span>Companies awaiting approval</span>
                                <span class="badge bg-warning text-dark">[[ stats.pending_companies || 0 ]]</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Jobs awaiting approval</span>
                                <span class="badge bg-warning text-dark">[[ stats.pending_jobs || 0 ]]</span>
                            </div>
                            <router-link to="/admin/companies" class="btn btn-outline-primary btn-sm mt-3">
                                Review Companies <i class="bi bi-arrow-right"></i>
                            </router-link>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card shadow-sm p-4">
                            <h5 class="fw-bold mb-3"><i class="bi bi-lightning text-primary"></i> Quick Actions</h5>
                            <div class="d-grid gap-2">
                                <router-link to="/admin/companies" class="btn btn-outline-primary btn-sm text-start"><i class="bi bi-building"></i> Manage Companies</router-link>
                                <router-link to="/admin/students" class="btn btn-outline-success btn-sm text-start"><i class="bi bi-people"></i> Manage Students</router-link>
                                <router-link to="/admin/jobs" class="btn btn-outline-info btn-sm text-start"><i class="bi bi-briefcase"></i> Manage Job Postings</router-link>
                                <router-link to="/admin/applications" class="btn btn-outline-secondary btn-sm text-start"><i class="bi bi-file-earmark-text"></i> View All Applications</router-link>
                                <button class="btn btn-outline-warning btn-sm text-start" @click="exportPlacements" :disabled="exporting">
                                    <span v-if="exporting" class="spinner-border spinner-border-sm me-1"></span>
                                    <i v-else class="bi bi-download"></i> Export Placements Report
                                </button>
                            </div>
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
            stats: {}, loading: true, exporting: false, exportMsg: '', exportMsgClass: 'alert-info',
            taskPollInterval: null
        };
    },
    computed: {
        statCards() {
            const s = this.stats;
            return [
                { value: s.total_students || 0, label: 'Students', color: 'primary', icon: 'bi bi-people-fill' },
                { value: s.total_companies || 0, label: 'Companies', color: 'success', icon: 'bi bi-building-fill' },
                { value: s.total_jobs || 0, label: 'Job Postings', color: 'info', icon: 'bi bi-briefcase-fill' },
                { value: s.total_applications || 0, label: 'Applications', color: 'warning', icon: 'bi bi-file-earmark-text-fill' },
                { value: s.total_placements || 0, label: 'Placements', color: 'secondary', icon: 'bi bi-trophy-fill' },
                { value: s.pending_companies || 0, label: 'Pending Companies', color: 'danger', icon: 'bi bi-hourglass-split' },
                { value: s.pending_jobs || 0, label: 'Pending Jobs', color: 'warning', icon: 'bi bi-clock-fill' },
                { value: s.active_jobs || 0, label: 'Active Jobs', color: 'success', icon: 'bi bi-check-circle-fill' },
            ];
        }
    },
    methods: {
        async fetchStats() {
            this.loading = true;
            try {
                const res = await api.adminDashboard();
                this.stats = res.stats;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async exportPlacements() {
            this.exporting = true;
            this.exportMsg = 'Starting export...';
            this.exportMsgClass = 'alert-info';
            try {
                const res = await api.exportPlacements();
                if (res.task_id) {
                    this.exportMsg = 'Export in progress...';
                    this.pollTask(res.task_id);
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
        },
        pollTask(taskId) {
            this.taskPollInterval = setInterval(async () => {
                try {
                    const res = await api.checkTaskStatus(taskId);
                    if (res.status === 'SUCCESS') {
                        clearInterval(this.taskPollInterval);
                        this.exportMsg = 'Export complete!';
                        this.exportMsgClass = 'alert-success';
                        this.exporting = false;
                        if (res.result && res.result.file) {
                            const url = api.downloadExportUrl(res.result.file);
                            console.debug('export download URL:', url);
                            window.open(url, '_blank');
                        }
                    } else if (res.status === 'FAILURE') {
                        clearInterval(this.taskPollInterval);
                        this.exportMsg = 'Export failed.';
                        this.exportMsgClass = 'alert-danger';
                        this.exporting = false;
                    }
                } catch (err) {
                    clearInterval(this.taskPollInterval);
                    this.exportMsg = 'Could not check task status.';
                    this.exportMsgClass = 'alert-warning';
                    this.exporting = false;
                }
            }, 2000);
        }
    },
    mounted() { this.fetchStats(); },
    beforeUnmount() { if (this.taskPollInterval) clearInterval(this.taskPollInterval); }
};
