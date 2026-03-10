const HomeComponent = {
    name: 'HomeComponent',
    template: `
    <div>
        <section class="hero-section">
            <div class="container py-5">
                <div class="row align-items-center">
                    <div class="col-lg-8 mx-auto text-center">
                        <h1 class="display-4 fw-bold mb-3">Placement Portal</h1>
                        <p class="lead mb-4 mx-auto" style="max-width:600px;">
                            Connecting talented students with top companies. Your career journey starts here.
                        </p>
                        <div class="d-flex gap-3 justify-content-center">
                            <router-link to="/register" class="btn btn-light btn-lg fw-semibold px-4">
                                <i class="bi bi-rocket-takeoff"></i> Get Started
                            </router-link>
                            <router-link to="/login" class="btn btn-outline-light btn-lg fw-semibold px-4">
                                <i class="bi bi-box-arrow-in-right"></i> Login
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="py-5">
            <div class="container">
                <h2 class="text-center fw-bold mb-5">How It Works</h2>
                <div class="row g-4">
                    <div class="col-md-4" v-for="feature in features" :key="feature.title">
                        <div class="card feature-card text-center p-4 h-100">
                            <div class="feature-icon mb-3"><i :class="feature.icon" style="font-size:3rem;"></i></div>
                            <h5 class="fw-bold">[[ feature.title ]]</h5>
                            <p class="text-muted">[[ feature.desc ]]</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="py-5 bg-dark text-white">
            <div class="container text-center">
                <div class="row g-4">
                    <div class="col-6 col-md-3" v-for="stat in stats" :key="stat.label">
                        <div class="display-5 fw-bold" :class="stat.color">[[ stat.value ]]</div>
                        <div class="text-white-50 mt-1">[[ stat.label ]]</div>
                    </div>
                </div>
            </div>
        </section>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return {
            features: [
                { icon: 'bi bi-person-badge text-primary', title: 'For Students', desc: 'Browse jobs, apply with one click, track your applications, and land your dream job.' },
                { icon: 'bi bi-building text-info', title: 'For Companies', desc: 'Post positions, review applicants, shortlist candidates, and schedule interviews.' },
                { icon: 'bi bi-shield-check text-success', title: 'For Admin', desc: 'Manage the entire placement ecosystem – approve profiles, monitor activity, and generate reports.' }
            ],
            stats: [
                { value: '500+', label: 'Students', color: 'text-info' },
                { value: '50+', label: 'Companies', color: 'text-success' },
                { value: '200+', label: 'Job Postings', color: 'text-warning' },
                { value: '95%', label: 'Placement Rate', color: 'text-danger' }
            ]
        };
    }
};
