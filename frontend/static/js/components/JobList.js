const JobList = {
    name: 'JobList',
    template: `
    <div class="container py-4 fade-in">
        <div class="section-header"><h4><i class="bi bi-briefcase"></i> Browse Job Postings</h4></div>
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="search-bar">
                    <i class="bi bi-search search-icon"></i>
                    <input type="text" class="form-control" v-model="search" placeholder="Search jobs..." @input="fetchJobs">
                </div>
            </div>
            <div class="col-md-3">
                <input type="text" class="form-control" v-model="companyFilter" placeholder="Filter by company" @input="fetchJobs">
            </div>
            <div class="col-md-3">
                <input type="text" class="form-control" v-model="skillsFilter" placeholder="Filter by skills" @input="fetchJobs">
            </div>
        </div>
        <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
        <div v-else-if="jobs.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i><h5>No jobs found</h5><p>Try adjusting your search filters</p>
        </div>
        <template v-else>
            <div class="row g-3">
                <div class="col-md-6" v-for="j in jobs" :key="j.id">
                    <div class="card job-card p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="fw-bold mb-0">[[ j.title ]]</h5>
                            <span class="badge badge-status badge-active">[[ j.status ]]</span>
                        </div>
                        <p class="text-primary mb-1"><i class="bi bi-building"></i> [[ j.company_name ]]</p>
                        <p class="text-muted small mb-2"><i class="bi bi-geo-alt"></i> [[ j.location || 'Remote' ]]</p>
                        <p v-if="j.salary_min || j.salary_max" class="text-success fw-semibold mb-2">
                            <i class="bi bi-currency-rupee"></i>
                            [[ j.salary_min ? j.salary_min.toLocaleString() : '' ]]
                            [[ j.salary_min && j.salary_max ? ' - ' : '' ]]
                            [[ j.salary_max ? j.salary_max.toLocaleString() : '' ]] LPA
                        </p>
                        <div class="mb-2">
                            <span class="skill-tag" v-for="s in (j.skills_required || '').split(',').slice(0,4)" :key="s">[[ s.trim() ]]</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <small class="text-muted">[[ formatDate(j.created_at) ]]</small>
                            <router-link :to="'/jobs/' + j.id" class="btn btn-primary btn-sm">View Details <i class="bi bi-arrow-right"></i></router-link>
                        </div>
                    </div>
                </div>
            </div>
            <nav v-if="totalPages > 1" class="mt-4">
                <ul class="pagination justify-content-center">
                    <li class="page-item" :class="{ disabled: page <= 1 }"><a class="page-link" href="#" @click.prevent="goPage(page-1)">Previous</a></li>
                    <li class="page-item" v-for="p in totalPages" :key="p" :class="{ active: p === page }"><a class="page-link" href="#" @click.prevent="goPage(p)">[[ p ]]</a></li>
                    <li class="page-item" :class="{ disabled: page >= totalPages }"><a class="page-link" href="#" @click.prevent="goPage(page+1)">Next</a></li>
                </ul>
            </nav>
        </template>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return { jobs: [], loading: true, search: '', companyFilter: '', skillsFilter: '', page: 1, totalPages: 1 };
    },
    methods: {
        formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; },
        goPage(p) { if (p >= 1 && p <= this.totalPages) { this.page = p; this.fetchJobs(); } },
        async fetchJobs() {
            this.loading = true;
            try {
                let params = `?page=${this.page}`;
                if (this.search) params += `&search=${this.search}`;
                if (this.companyFilter) params += `&company=${this.companyFilter}`;
                if (this.skillsFilter) params += `&skills=${this.skillsFilter}`;
                const res = await api.listJobs(params);
                this.jobs = res.jobs;
                this.totalPages = res.pages;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        }
    },
    mounted() { this.fetchJobs(); }
};
