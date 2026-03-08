const RegisterComponent = {
    name: 'RegisterComponent',
    template: `
    <div class="container" style="max-width:480px;margin-top:3rem;">
        <div class="card shadow p-4">
            <div class="text-center mb-4">
                <i class="bi bi-person-plus-fill text-primary" style="font-size:2.5rem;"></i>
                <h2 class="mt-2 fw-bold">Create Account</h2>
                <p class="text-muted">Register as a Student or Company</p>
            </div>
            <div v-if="error" class="alert alert-danger">[[ error ]]</div>
            <div v-if="success" class="alert alert-success">[[ success ]]</div>
            <ul class="nav nav-pills nav-fill mb-4">
                <li class="nav-item">
                    <a class="nav-link" :class="{ active: role === 'student' }" href="#" @click.prevent="role = 'student'">
                        <i class="bi bi-mortarboard"></i> Student
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{ active: role === 'company' }" href="#" @click.prevent="role = 'company'">
                        <i class="bi bi-building"></i> Company
                    </a>
                </li>
            </ul>
            <form @submit.prevent="register">
                <div class="mb-3">
                    <label class="form-label fw-semibold">[[ role === 'student' ? 'Full Name' : 'Company Name' ]]</label>
                    <input type="text" class="form-control" v-model="name" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Email</label>
                    <input type="email" class="form-control" v-model="email" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Password</label>
                    <input type="password" class="form-control" v-model="password" minlength="6" required>
                </div>
                <template v-if="role === 'student'">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Phone</label>
                        <input type="tel" class="form-control" v-model="phone">
                    </div>
                    <div class="row mb-3">
                        <div class="col-6">
                            <label class="form-label fw-semibold">CGPA</label>
                            <input type="number" step="0.01" class="form-control" v-model="cgpa">
                        </div>
                        <div class="col-6">
                            <label class="form-label fw-semibold">Graduation Year</label>
                            <input type="number" class="form-control" v-model="graduationYear">
                        </div>
                    </div>
                </template>
                <template v-if="role === 'company'">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Industry</label>
                        <input type="text" class="form-control" v-model="industry">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Location</label>
                        <input type="text" class="form-control" v-model="location">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Website</label>
                        <input type="url" class="form-control" v-model="website">
                    </div>
                </template>
                <button type="submit" class="btn btn-primary w-100 py-2 mt-2" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-person-plus me-2"></i> Register
                </button>
            </form>
            <div class="text-center mt-4">
                <p class="text-muted">Already have an account? <router-link to="/login" class="fw-semibold">Sign In</router-link></p>
            </div>
        </div>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return {
            role: 'student', name: '', email: '', password: '',
            phone: '', cgpa: '', graduationYear: '',
            industry: '', location: '', website: '',
            error: '', success: '', loading: false
        };
    },
    methods: {
        async register() {
            this.loading = true;
            this.error = '';
            this.success = '';
            try {
                const data = { name: this.name, email: this.email, password: this.password };
                if (this.role === 'student') {
                    data.phone = this.phone;
                    data.cgpa = this.cgpa || null;
                    data.graduation_year = this.graduationYear || null;
                    await api.registerStudent(data);
                    this.success = 'Registration successful! Redirecting to login...';
                    setTimeout(() => this.$router.push('/login'), 2000);
                } else {
                    data.industry = this.industry;
                    data.location = this.location;
                    data.website = this.website;
                    await api.registerCompany(data);
                    this.success = 'Company registered! Please wait for admin approval before logging in.';
                }
            } catch (err) {
                this.error = err.message || 'Registration failed.';
            } finally {
                this.loading = false;
            }
        }
    }
};
