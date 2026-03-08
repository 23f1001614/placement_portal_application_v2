const JobDetail = {
    name: 'JobDetail',
    template: `
    <div class="container py-4 fade-in">
        <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
        <template v-else>
            <div class="row">
                <div class="col-lg-8">
                    <div class="card shadow-sm p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div><h3 class="fw-bold">[[ job.title ]]</h3><p class="text-primary mb-1"><i class="bi bi-building"></i> [[ job.company_name ]]</p></div>
                            <span class="badge badge-status" :class="'badge-' + job.status">[[ job.status ]]</span>
                        </div>
                        <hr>
                        <div class="row mb-3">
                            <div class="col-sm-4"><strong><i class="bi bi-geo-alt"></i> Location</strong><br>[[ job.location || 'Remote' ]]</div>
                            <div class="col-sm-4"><strong><i class="bi bi-currency-rupee"></i> Salary</strong><br>[[ job.salary_min || '—' ]] - [[ job.salary_max || '—' ]] LPA</div>
                            <div class="col-sm-4"><strong><i class="bi bi-briefcase"></i> Experience</strong><br>[[ job.experience_required || 'Fresher' ]]</div>
                        </div>
                        <h5 class="fw-bold mt-3">Description</h5>
                        <p class="text-muted">[[ job.description || 'No description provided.' ]]</p>
                        <h5 class="fw-bold mt-3">Skills Required</h5>
                        <div>
                            <span class="skill-tag" v-for="s in (job.skills_required || '').split(',')" :key="s">[[ s.trim() ]]</span>
                            <span v-if="!job.skills_required" class="text-muted">Not specified</span>
                        </div>
                        <template v-if="job.benefits">
                            <h5 class="fw-bold mt-3">Benefits</h5>
                            <p class="text-muted">[[ job.benefits ]]</p>
                        </template>
                        <div class="mt-3 text-muted small">
                            <span v-if="job.deadline"><i class="bi bi-calendar"></i> Deadline: [[ formatDate(job.deadline) ]] | </span>
                            <span>Posted: [[ formatDate(job.created_at) ]]</span>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 mt-3 mt-lg-0">
                    <div class="card shadow-sm p-4">
                        <h5 class="fw-bold mb-3">Apply Now</h5>
                        <div v-if="applyMsg" class="alert" :class="applyMsgClass">[[ applyMsg ]]</div>
                        <template v-if="isStudent && !applied">
                            <button class="btn btn-primary w-100" @click="apply" :disabled="applying">
                                <span v-if="applying" class="spinner-border spinner-border-sm me-2"></span>
                                <i v-else class="bi bi-send me-2"></i> Submit Application
                            </button>
                        </template>
                        <p v-else-if="!isStudent" class="text-muted small"><i class="bi bi-info-circle"></i> Only students can apply for jobs.</p>
                    </div>
                    <div v-if="job.company" class="card shadow-sm p-4 mt-3">
                        <h5 class="fw-bold mb-3">About Company</h5>
                        <p class="mb-1"><strong>[[ job.company.name ]]</strong></p>
                        <p class="text-muted small mb-1"><i class="bi bi-tags"></i> [[ job.company.industry || 'N/A' ]]</p>
                        <p class="text-muted small mb-1"><i class="bi bi-geo-alt"></i> [[ job.company.location || 'N/A' ]]</p>
                        <p v-if="job.company.website" class="text-muted small"><i class="bi bi-globe"></i> <a :href="job.company.website" target="_blank">[[ job.company.website ]]</a></p>
                    </div>
                </div>
            </div>
            <router-link to="/jobs" class="btn btn-outline-secondary mt-3"><i class="bi bi-arrow-left"></i> Back to Jobs</router-link>
        </template>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return { job: {}, loading: true, applying: false, applied: false, applyMsg: '', applyMsgClass: 'alert-success' };
    },
    computed: {
        isStudent() { return store.role === 'student'; }
    },
    methods: {
        formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; },
        async fetchJob() {
            this.loading = true;
            try {
                const res = await api.getJob(this.$route.params.id);
                this.job = res.job;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async apply() {
            this.applying = true;
            this.applyMsg = '';
            try {
                await api.applyForJob(this.job.id);
                this.applyMsg = 'Application submitted successfully!';
                this.applyMsgClass = 'alert-success';
                this.applied = true;
            } catch (err) {
                if (err.status === 409) {
                    this.applyMsg = 'You have already applied for this job.';
                    this.applyMsgClass = 'alert-info';
                    this.applied = true;
                } else {
                    this.applyMsg = err.message || 'Failed to apply.';
                    this.applyMsgClass = 'alert-danger';
                }
            } finally { this.applying = false; }
        }
    },
    mounted() { this.fetchJob(); }
};
