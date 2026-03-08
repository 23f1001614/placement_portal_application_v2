const CompanyDashboard = {
    name: 'CompanyDashboard',
    template: `
    <div>
        <div class="dashboard-header">
            <div class="container">
                <h2><i class="bi bi-building"></i> Company Dashboard</h2>
                <p class="mb-0 opacity-75">Welcome, [[ company.name || 'Company' ]]</p>
            </div>
        </div>
        <div class="container py-4 fade-in">
            <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
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
                    <div class="col-md-4">
                        <div class="card shadow-sm p-4">
                            <h5 class="fw-bold mb-3"><i class="bi bi-briefcase text-primary"></i> Manage Jobs</h5>
                            <p class="text-muted">Post new positions and manage applications</p>
                            <router-link to="/company/jobs" class="btn btn-primary"><i class="bi bi-plus-circle"></i> View / Post Jobs</router-link>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card shadow-sm p-4">
                            <h5 class="fw-bold mb-3"><i class="bi bi-person-lines-fill text-success"></i> Company Profile</h5>
                            <p class="text-muted mb-2"><strong>Industry:</strong> [[ company.industry || 'N/A' ]]</p>
                            <p class="text-muted mb-2"><strong>Location:</strong> [[ company.location || 'N/A' ]]</p>
                            <p class="text-muted"><strong>Status:</strong>
                                <span class="badge" :class="company.is_approved ? 'bg-success' : 'bg-warning text-dark'">[[ company.is_approved ? 'Approved' : 'Pending' ]]</span>
                            </p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card shadow-sm p-4">
                            <h5 class="fw-bold mb-3"><i class="bi bi-graph-up text-warning"></i> Reports &amp; Export</h5>
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-warning btn-sm" @click="generateReport" :disabled="reportLoading">
                                    <span v-if="reportLoading" class="spinner-border spinner-border-sm me-1"></span>
                                    <i v-else class="bi bi-file-earmark-bar-graph me-1"></i> Generate Placement Report
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" @click="exportApps" :disabled="exportLoading">
                                    <span v-if="exportLoading" class="spinner-border spinner-border-sm me-1"></span>
                                    <i v-else class="bi bi-filetype-csv me-1"></i> Export Applications (CSV)
                                </button>
                            </div>
                            <div v-if="actionMsg" class="alert mt-2 mb-0" :class="actionMsgClass">[[ actionMsg ]]</div>
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
            stats: {}, company: {}, loading: true,
            reportLoading: false, exportLoading: false, actionMsg: '', actionMsgClass: 'alert-info',
            taskPollInterval: null
        };
    },
    computed: {
        statCards() {
            const s = this.stats;
            return [
                { value: s.total_jobs || 0, label: 'Total Jobs', color: 'primary', icon: 'bi bi-briefcase-fill' },
                { value: s.active_jobs || 0, label: 'Active Jobs', color: 'success', icon: 'bi bi-check-circle-fill' },
                { value: s.total_applications || 0, label: 'Applications', color: 'info', icon: 'bi bi-file-earmark-text-fill' },
                { value: s.shortlisted_candidates || 0, label: 'Shortlisted', color: 'warning', icon: 'bi bi-star-fill' },
            ];
        }
    },
    methods: {
        async fetchDashboard() {
            this.loading = true;
            try {
                const res = await api.companyDashboard();
                this.stats = res.stats;
                this.company = res.company;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async generateReport() {
            this.reportLoading = true;
            this.actionMsg = 'Generating report...';
            this.actionMsgClass = 'alert-info';
            try {
                const res = await api.generateReport(this.company.id);
                if (res.task_id) {
                    this.actionMsg = 'Report in progress...';
                    this.pollTask(res.task_id, 'reportLoading');
                } else if (res.result && res.result.file) {
                    this.actionMsg = 'Report generated!';
                    this.actionMsgClass = 'alert-success';
                    this.reportLoading = false;
                    window.open(api.downloadExportUrl(res.result.file), '_blank');
                } else {
                    this.actionMsg = 'Report generated!';
                    this.actionMsgClass = 'alert-success';
                    this.reportLoading = false;
                }
            } catch (err) {
                this.actionMsg = err.message || 'Failed.';
                this.actionMsgClass = 'alert-danger';
                this.reportLoading = false;
            }
        },
        async exportApps() {
            this.exportLoading = true;
            this.actionMsg = 'Starting export...';
            this.actionMsgClass = 'alert-info';
            try {
                const res = await api.exportApplications();
                if (res.task_id) {
                    this.actionMsg = 'Export in progress...';
                    this.pollTask(res.task_id, 'exportLoading');
                } else {
                    this.actionMsg = 'Export completed!';
                    this.actionMsgClass = 'alert-success';
                    this.exportLoading = false;
                }
            } catch (err) {
                this.actionMsg = err.message || 'Export failed.';
                this.actionMsgClass = 'alert-danger';
                this.exportLoading = false;
            }
        },
        pollTask(taskId, loadingKey) {
            this.taskPollInterval = setInterval(async () => {
                try {
                    const res = await api.checkTaskStatus(taskId);
                    if (res.status === 'SUCCESS') {
                        clearInterval(this.taskPollInterval);
                        this.actionMsg = 'Complete!';
                        this.actionMsgClass = 'alert-success';
                        this[loadingKey] = false;
                        if (res.result && res.result.file) window.open(api.downloadExportUrl(res.result.file), '_blank');
                    } else if (res.status === 'FAILURE') {
                        clearInterval(this.taskPollInterval);
                        this.actionMsg = 'Task failed.';
                        this.actionMsgClass = 'alert-danger';
                        this[loadingKey] = false;
                    }
                } catch (err) {
                    clearInterval(this.taskPollInterval);
                    this.actionMsg = 'Could not check task status.';
                    this.actionMsgClass = 'alert-warning';
                    this[loadingKey] = false;
                }
            }, 2000);
        }
    },
    mounted() { this.fetchDashboard(); },
    beforeUnmount() { if (this.taskPollInterval) clearInterval(this.taskPollInterval); }
};
