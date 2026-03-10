const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    { path: '/', component: HomeComponent },
    { path: '/login', component: LoginComponent },
    { path: '/register', component: RegisterComponent },
    { path: '/admin', component: AdminDashboard, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/companies', component: AdminCompanies, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/students', component: AdminStudents, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/jobs', component: AdminJobs, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/applications', component: AdminApplications, meta: { requiresAuth: true, role: 'admin' } },
    { path: '/company', component: CompanyDashboard, meta: { requiresAuth: true, role: 'company' } },
    { path: '/company/jobs', component: CompanyJobs, meta: { requiresAuth: true, role: 'company' } },
    { path: '/company/jobs/:jobId/applications', component: CompanyApplications, meta: { requiresAuth: true, role: 'company' } },
    { path: '/student', component: StudentDashboard, meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/applications', component: StudentApplications, meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/profile', component: StudentProfile, meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/placements', component: StudentPlacements, meta: { requiresAuth: true, role: 'student' } },
    { path: '/jobs', component: JobList, meta: { requiresAuth: true } },
    { path: '/jobs/:id', component: JobDetail, meta: { requiresAuth: true } },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});


router.beforeEach((to, from, next) => {
    const isLoggedIn = store.isLoggedIn;
    const userRole = store.role;

    if (to.meta.requiresAuth && !isLoggedIn) {
        return next('/login');
    }

    if (to.meta.role && to.meta.role !== userRole) {
        const dashboardMap = { admin: '/admin', company: '/company', student: '/student' };
        return next(dashboardMap[userRole] || '/');
    }

    if (isLoggedIn && (to.path === '/login' || to.path === '/register')) {
        const dashboardMap = { admin: '/admin', company: '/company', student: '/student' };
        return next(dashboardMap[userRole] || '/');
    }

    next();
});

const app = createApp({
    delimiters: ['[[', ']]'],
    data() {
        return { store };
    },
    methods: {
        showToast(message, type = 'success') {
            const toastEl = document.getElementById('appToast');
            if (toastEl) {
                const body = toastEl.querySelector('.toast-body');
                body.textContent = message;
                toastEl.className = `toast align-items-center text-bg-${type} border-0`;
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            }
        }
    }
});

app.config.globalProperties.$router = router;
app.config.globalProperties.$store = store;


app.component('navbar-component', NavbarComponent);
app.component('home-component', HomeComponent);
app.component('login-component', LoginComponent);
app.component('register-component', RegisterComponent);
app.component('admin-dashboard', AdminDashboard);
app.component('admin-companies', AdminCompanies);
app.component('admin-students', AdminStudents);
app.component('admin-jobs', AdminJobs);
app.component('admin-applications', AdminApplications);
app.component('company-dashboard', CompanyDashboard);
app.component('company-jobs', CompanyJobs);
app.component('company-applications', CompanyApplications);
app.component('student-dashboard', StudentDashboard);
app.component('student-applications', StudentApplications);
app.component('student-profile', StudentProfile);
app.component('student-placements', StudentPlacements);
app.component('job-list', JobList);
app.component('job-detail', JobDetail);

app.use(router);
app.mount('#app');
