const AdminStudents = {
    name: 'AdminStudents',
    template: `
    <div class="container py-4 fade-in">
        <div class="section-header">
            <h4><i class="bi bi-people"></i> Manage Students</h4>
        </div>
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="search-bar">
                    <i class="bi bi-search search-icon"></i>
                    <input type="text" class="form-control" v-model="search" placeholder="Search students..."
                        @input="fetchStudents">
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" v-model="statusFilter" @change="fetchStudents">
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="blacklisted">Blacklisted</option>
                </select>
            </div>
        </div>
        <div v-if="loading" class="loading-container">
            <div class="spinner-border spinner-custom" role="status"></div>
        </div>
        <div v-else-if="students.length === 0" class="empty-state">
            <i class="bi bi-people"></i>
            <h5>No students found</h5>
        </div>
        <div v-else class="table-responsive">
            <table class="table table-custom">
                <thead>
                    <tr><th>Name</th><th>Phone</th><th>CGPA</th><th>Skills</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    <tr v-for="s in students" :key="s.id">
                        <td class="fw-semibold">[[ s.name ]]</td>
                        <td>[[ s.phone || '—' ]]</td>
                        <td>[[ s.cgpa || '—' ]]</td>
                        <td>
                            <span class="skill-tag" v-for="sk in (s.skills||'').split(',').slice(0,3)" :key="sk">[[ sk.trim() ]]</span>
                        </td>
                        <td>
                            <span class="badge badge-status" :class="s.is_blacklisted ? 'badge-blacklisted' : 'badge-approved'">
                                [[ s.is_blacklisted ? 'Blacklisted' : 'Active' ]]
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm" :class="s.is_blacklisted ? 'btn-outline-success' : 'btn-outline-danger'"
                                @click="blacklist(s.id)">
                                <i class="bi bi-shield-exclamation"></i> [[ s.is_blacklisted ? 'Unblock' : 'Blacklist' ]]
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
        return { students: [], loading: true, search: '', statusFilter: '' };
    },
    methods: {
        async fetchStudents() {
            this.loading = true;
            try {
                let params = '?';
                if (this.search) params += `search=${this.search}&`;
                if (this.statusFilter) params += `status=${this.statusFilter}&`;
                const res = await api.adminStudents(params);
                this.students = res.students;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async blacklist(id) { await api.blacklistStudent(id); this.fetchStudents(); }
    },
    mounted() { this.fetchStudents(); }
};
