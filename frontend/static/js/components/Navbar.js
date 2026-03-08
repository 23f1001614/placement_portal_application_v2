const NavbarComponent = {
    name: 'NavbarComponent',
    template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top shadow">
        <div class="container">
            <router-link class="navbar-brand fw-bold" to="/">
                <i class="bi bi-mortarboard-fill text-info"></i> PPA
            </router-link>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto align-items-center gap-1">
                    <template v-if="!store.isLoggedIn">
                        <li class="nav-item">
                            <router-link class="nav-link" to="/login"><i class="bi bi-box-arrow-in-right"></i> Login</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/register"><i class="bi bi-person-plus"></i> Register</router-link>
                        </li>
                    </template>
                    <template v-else>
                        <template v-if="store.role === 'admin'">
                            <li class="nav-item"><router-link class="nav-link" to="/admin"><i class="bi bi-speedometer2"></i> Dashboard</router-link></li>
                            <li class="nav-item"><router-link class="nav-link" to="/admin/companies"><i class="bi bi-building"></i> Companies</router-link></li>
                            <li class="nav-item"><router-link class="nav-link" to="/admin/students"><i class="bi bi-people"></i> Students</router-link></li>
                            <li class="nav-item"><router-link class="nav-link" to="/admin/jobs"><i class="bi bi-briefcase"></i> Jobs</router-link></li>
                            <li class="nav-item"><router-link class="nav-link" to="/admin/applications"><i class="bi bi-file-earmark-text"></i> Applications</router-link></li>
                        </template>
                        <template v-if="store.role === 'company'">
                            <li class="nav-item"><router-link class="nav-link" to="/company"><i class="bi bi-speedometer2"></i> Dashboard</router-link></li>
                            <li class="nav-item"><router-link class="nav-link" to="/company/jobs"><i class="bi bi-briefcase"></i> My Jobs</router-link></li>
                        </template>
                        <template v-if="store.role === 'student'">
                            <li class="nav-item"><router-link class="nav-link" to="/student"><i class="bi bi-speedometer2"></i> Dashboard</router-link></li>
                            <li class="nav-item"><router-link class="nav-link" to="/jobs"><i class="bi bi-search"></i> Browse Jobs</router-link></li>
                            <li class="nav-item"><router-link class="nav-link" to="/student/applications"><i class="bi bi-file-earmark-text"></i> Applications</router-link></li>
                            <li class="nav-item"><router-link class="nav-link" to="/student/profile"><i class="bi bi-person"></i> Profile</router-link></li>
                            <li class="nav-item"><router-link class="nav-link" to="/student/placements"><i class="bi bi-trophy"></i> Placements</router-link></li>
                        </template>
                        <li class="nav-item ms-2">
                            <span class="badge" :class="roleBadgeClass" style="font-size:.7rem;padding:.35em .7em;border-radius:20px;">
                                [[ store.role.toUpperCase() ]]
                            </span>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#" @click.prevent="logout"><i class="bi bi-box-arrow-right"></i> Logout</a>
                        </li>
                    </template>
                </ul>
            </div>
        </div>
    </nav>
    `,
    delimiters: ['[[', ']]'],
    computed: {
        store() { return store; },
        roleBadgeClass() {
            const map = { admin: 'bg-danger', company: 'bg-info', student: 'bg-success' };
            return map[store.role] || 'bg-secondary';
        }
    },
    methods: {
        logout() {
            store.logout();
            this.$router.push('/login');
        }
    }
};
