const LoginComponent = {
    name: 'LoginComponent',
    template: `
    <div class="container" style="max-width:480px;margin-top:3rem;">
        <div class="card shadow p-4">
            <div class="text-center mb-4">
                <i class="bi bi-mortarboard-fill text-primary" style="font-size:2.5rem;"></i>
                <h2 class="mt-2 fw-bold">Welcome Back</h2>
                <p class="text-muted">Sign in to your account</p>
            </div>
            <div v-if="error" class="alert alert-danger">[[ error ]]</div>
            <form @submit.prevent="login">
                <div class="mb-3">
                    <label class="form-label fw-semibold">Email</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                        <input type="email" class="form-control" v-model="email" placeholder="Enter your email" required>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="form-label fw-semibold">Password</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-lock"></i></span>
                        <input type="password" class="form-control" v-model="password" placeholder="Enter your password" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary w-100 py-2" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-box-arrow-in-right me-2"></i> Sign In
                </button>
            </form>
            <div class="text-center mt-4">
                <p class="text-muted">Don't have an account? <router-link to="/register" class="fw-semibold">Register</router-link></p>
            </div>
        </div>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return { email: '', password: '', error: '', loading: false };
    },
    methods: {
        async login() {
            this.loading = true;
            this.error = '';
            try {
                const res = await api.login({ email: this.email, password: this.password });
                store.login(res.token, res.user);
                const dashboardMap = { admin: '/admin', company: '/company', student: '/student' };
                this.$router.push(dashboardMap[res.user.role] || '/');
            } catch (err) {
                this.error = err.message || 'Login failed. Please try again.';
            } finally {
                this.loading = false;
            }
        }
    }
};
