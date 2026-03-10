const CompanyJobs = {
    name: 'CompanyJobs',
    template: `
    <div class="container py-4 fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="section-header mb-0"><h4><i class="bi bi-briefcase"></i> My Job Postings</h4></div>
            <button class="btn btn-primary" @click="showForm = !showForm">
                <i class="bi bi-plus-circle"></i> [[ showForm ? 'Cancel' : 'Post New Job' ]]
            </button>
        </div>
        <div v-if="showForm" class="card shadow-sm p-4 mb-4">
            <h5 class="fw-bold mb-3">New Job Position</h5>
            <form @submit.prevent="createJob">
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label fw-semibold">Job Title *</label><input type="text" class="form-control" v-model="form.title" required></div>
                    <div class="col-md-6"><label class="form-label fw-semibold">Location</label><input type="text" class="form-control" v-model="form.location" placeholder="City, Remote, etc."></div>
                    <div class="col-12"><label class="form-label fw-semibold">Description</label><textarea class="form-control" v-model="form.description" rows="3"></textarea></div>
                    <div class="col-md-3"><label class="form-label fw-semibold">Min Salary (LPA)</label><input type="number" step="any" class="form-control" v-model="form.salary_min"></div>
                    <div class="col-md-3"><label class="form-label fw-semibold">Max Salary (LPA)</label><input type="number" step="any" class="form-control" v-model="form.salary_max"></div>
                    <div class="col-md-3"><label class="form-label fw-semibold">Experience</label><input type="text" class="form-control" v-model="form.experience_required" placeholder="0-2 years"></div>
                    <div class="col-md-3"><label class="form-label fw-semibold">Deadline</label><input type="date" class="form-control" v-model="form.deadline"></div>
                    <div class="col-md-6"><label class="form-label fw-semibold">Skills (comma-separated)</label><input type="text" class="form-control" v-model="form.skills_required" placeholder="Python, JavaScript, SQL"></div>
                    <div class="col-md-6"><label class="form-label fw-semibold">Benefits</label><input type="text" class="form-control" v-model="form.benefits" placeholder="Health insurance, WFH, etc."></div>
                </div>
                <button type="submit" class="btn btn-primary mt-3" :disabled="posting">
                    <span v-if="posting" class="spinner-border spinner-border-sm me-2"></span> Post Job
                </button>
            </form>
        </div>
        <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
        <div v-else-if="jobs.length === 0" class="empty-state"><i class="bi bi-inbox"></i><h5>No job postings yet</h5></div>
        <div v-else class="table-responsive">
            <table class="table table-custom">
                <thead><tr><th>Title</th><th>Location</th><th>Salary</th><th>Status</th><th>Approved</th><th>Actions</th></tr></thead>
                <tbody>
                    <tr v-for="j in jobs" :key="j.id">
                        <td class="fw-semibold">[[ j.title ]]</td>
                        <td>[[ j.location || '—' ]]</td>
                        <td>[[ j.salary_min || '—' ]] - [[ j.salary_max || '—' ]]</td>
                        <td><span class="badge badge-status" :class="'badge-' + j.status">[[ j.status ]]</span></td>
                        <td><span class="badge badge-status" :class="j.is_approved ? 'badge-approved' : 'badge-pending'">[[ j.is_approved ? 'Yes' : 'Pending' ]]</span></td>
                        <td>
                            <router-link :to="'/company/jobs/' + j.id + '/applications'" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-people"></i> Applicants</router-link>
                            <button class="btn btn-sm btn-outline-secondary" @click="toggleStatus(j)">
                                <i :class="j.status === 'active' ? 'bi bi-pause' : 'bi bi-play'"></i>
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
        return {
            jobs: [], loading: true, showForm: false, posting: false,
            form: { title: '', description: '', salary_min: '', salary_max: '', skills_required: '', experience_required: '', benefits: '', location: '', deadline: '' }
        };
    },
    methods: {
        async fetchJobs() {
            this.loading = true;
            try {
                const res = await api.companyJobs();
                this.jobs = res.jobs;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async createJob() {
            this.posting = true;
            try {
                await api.createJob(this.form);
                this.showForm = false;
                this.form = { title: '', description: '', salary_min: '', salary_max: '', skills_required: '', experience_required: '', benefits: '', location: '', deadline: '' };
                this.fetchJobs();
            } catch (err) { alert(err.message || 'Failed to create job'); }
            finally { this.posting = false; }
        },
        async toggleStatus(job) {
            const newStatus = job.status === 'active' ? 'closed' : 'active';
            await api.updateJob(job.id, { status: newStatus });
            this.fetchJobs();
        }
    },
    mounted() { this.fetchJobs(); }
};
