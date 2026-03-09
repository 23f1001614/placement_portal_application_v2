const StudentProfile = {
    name: 'StudentProfile',
    template: `
    <div class="container py-4 fade-in">
        <div class="section-header"><h4><i class="bi bi-person"></i> My Profile</h4></div>
        <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
        <template v-else>
            <div v-if="msg" class="alert" :class="msgClass">[[ msg ]]</div>
            <div class="row g-4">
                <div class="col-md-8">
                    <div class="card shadow-sm p-4">
                        <h5 class="fw-bold mb-3">Profile Information</h5>
                        <form @submit.prevent="saveProfile">
                            <div class="row g-3">
                                <div class="col-md-6"><label class="form-label fw-semibold">Full Name</label><input type="text" class="form-control" v-model="form.name" required></div>
                                <div class="col-md-6"><label class="form-label fw-semibold">Phone</label><input type="tel" class="form-control" v-model="form.phone"></div>
                                <div class="col-md-6"><label class="form-label fw-semibold">CGPA</label><input type="number" step="0.01" class="form-control" v-model="form.cgpa"></div>
                                <div class="col-md-6"><label class="form-label fw-semibold">Graduation Year</label><input type="number" class="form-control" v-model="form.graduation_year"></div>
                                <div class="col-12"><label class="form-label fw-semibold">Education</label><textarea class="form-control" v-model="form.education" rows="2"></textarea></div>
                                <div class="col-12"><label class="form-label fw-semibold">Skills (comma-separated)</label><input type="text" class="form-control" v-model="form.skills"></div>
                                <div class="col-12"><label class="form-label fw-semibold">Experience</label><textarea class="form-control" v-model="form.experience" rows="2"></textarea></div>
                            </div>
                            <button type="submit" class="btn btn-primary mt-3" :disabled="saving">
                                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                                <i v-else class="bi bi-check-circle me-2"></i> Save Profile
                            </button>
                        </form>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card shadow-sm p-4">
                        <h5 class="fw-bold mb-3"><i class="bi bi-file-earmark-pdf"></i> Resume</h5>
                        <p v-if="student.resume_path" class="text-success"><i class="bi bi-check-circle"></i> Resume uploaded: [[ student.resume_path ]]</p>
                        <p v-else class="text-muted">No resume uploaded yet.</p>
                        <input type="file" class="form-control" @change="onFileSelect" accept=".pdf,.doc,.docx" ref="resumeInput">
                        <button class="btn btn-outline-primary btn-sm mt-2" @click="uploadResume" :disabled="!selectedFile || uploading">
                            <span v-if="uploading" class="spinner-border spinner-border-sm me-1"></span>
                            <i v-else class="bi bi-upload me-1"></i> Upload Resume
                        </button>
                    </div>
                    <div class="card shadow-sm p-4 mt-3">
                        <h5 class="fw-bold mb-3">Skills Preview</h5>
                        <div v-if="form.skills">
                            <span class="skill-tag" v-for="s in form.skills.split(',')" :key="s">[[ s.trim() ]]</span>
                        </div>
                        <p v-else class="text-muted">Add skills to your profile</p>
                    </div>
                </div>
            </div>
        </template>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() {
        return {
            student: {}, form: {}, loading: true, saving: false, uploading: false,
            msg: '', msgClass: 'alert-success', selectedFile: null
        };
    },
    methods: {
        async fetchProfile() {
            this.loading = true;
            try {
                const res = await api.getMe();
                this.student = res.user.student || {};
                this.form = { ...this.student };
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async saveProfile() {
            this.saving = true;
            this.msg = '';
            try {
                await api.updateStudentProfile(this.form);
                this.msg = 'Profile updated successfully!';
                this.msgClass = 'alert-success';
            } catch (err) {
                this.msg = err.message || 'Failed to update.';
                this.msgClass = 'alert-danger';
            } finally { this.saving = false; }
        },
        onFileSelect(e) { this.selectedFile = e.target.files[0]; },
        async uploadResume() {
            if (!this.selectedFile) return;
            this.uploading = true;
            this.msg = '';
            try {
                const fd = new FormData();
                fd.append('resume', this.selectedFile);
                await api.uploadResume(fd);
                this.msg = 'Resume uploaded!';
                this.msgClass = 'alert-success';
                this.fetchProfile();
            } catch (err) {
                this.msg = err.message || 'Upload failed.';
                this.msgClass = 'alert-danger';
            } finally { this.uploading = false; }
        }
    },
    mounted() { this.fetchProfile(); }
};
