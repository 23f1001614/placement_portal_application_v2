const API_BASE = '/api';

let _tokenCache = null;

const api = {
    getToken() {
        if (_tokenCache) return _tokenCache;
        try {
            _tokenCache = localStorage.getItem('ppa_token');
            if (!_tokenCache) {
                _tokenCache = sessionStorage.getItem('ppa_token');
            }
        } catch (e) {
            _tokenCache = sessionStorage.getItem('ppa_token');
        }
        if (!_tokenCache && window.store && window.store.state) {
            _tokenCache = window.store.state.token || null;
        }
        return _tokenCache;
    },

    setToken(token) {
        _tokenCache = token;
        try {
            localStorage.setItem('ppa_token', token);
        } catch (e) {
            sessionStorage.setItem('ppa_token', token);
        }
    },

    removeToken() {
        _tokenCache = null;
        try {
            localStorage.removeItem('ppa_token');
            localStorage.removeItem('ppa_user');
        } catch (e) {
            sessionStorage.removeItem('ppa_token');
            sessionStorage.removeItem('ppa_user');
        }
    },

    getUser() {
        try {
            const u = localStorage.getItem('ppa_user') || sessionStorage.getItem('ppa_user');
            return u ? JSON.parse(u) : null;
        } catch (e) {
            return null;
        }
    },

    setUser(user) {
        try {
            localStorage.setItem('ppa_user', JSON.stringify(user));
        } catch (e) {
            sessionStorage.setItem('ppa_user', JSON.stringify(user));
        }
    },

    headers() {
        const h = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    },

    async request(method, endpoint, data = null) {
        const options = {
            method,
            headers: this.headers(),
        };
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const json = await response.json();

        if (!response.ok) {
            throw { status: response.status, ...json };
        }
        return json;
    },

    async downloadFile(filename) {
        const token = this.getToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/export/download/${encodeURIComponent(filename)}`, {
            method: 'GET',
            headers,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Download failed');
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    async uploadFile(endpoint, formData) {
        const h = {};
        const token = this.getToken();
        if (token) h['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: h,
            body: formData,
        });
        const json = await response.json();
        if (!response.ok) throw { status: response.status, ...json };
        return json;
    },


    login: (data) => api.request('POST', '/auth/login', data),
    registerStudent: (data) => api.request('POST', '/auth/register/student', data),
    registerCompany: (data) => api.request('POST', '/auth/register/company', data),
    getMe: () => api.request('GET', '/auth/me'),

    adminDashboard: () => api.request('GET', '/admin/dashboard'),
    adminCompanies: (params = '') => api.request('GET', `/admin/companies${params}`),
    approveCompany: (id) => api.request('PUT', `/admin/companies/${id}/approve`),
    removeCompany: (id) => api.request('DELETE', `/admin/companies/${id}`),
    blacklistCompany: (id) => api.request('PUT', `/admin/companies/${id}/blacklist`),
    adminStudents: (params = '') => api.request('GET', `/admin/students${params}`),
    blacklistStudent: (id) => api.request('PUT', `/admin/students/${id}/blacklist`),
    adminJobs: (params = '') => api.request('GET', `/admin/jobs${params}`),
    approveJob: (id) => api.request('PUT', `/admin/jobs/${id}/approve`),
    removeJob: (id) => api.request('DELETE', `/admin/jobs/${id}`),
    adminApplications: () => api.request('GET', '/admin/applications'),

    companyDashboard: () => api.request('GET', '/company/dashboard'),
    updateCompanyProfile: (data) => api.request('PUT', '/company/profile', data),
    companyJobs: () => api.request('GET', '/company/jobs'),
    createJob: (data) => api.request('POST', '/company/jobs', data),
    updateJob: (id, data) => api.request('PUT', `/company/jobs/${id}`, data),
    jobApplications: (jobId) => api.request('GET', `/company/jobs/${jobId}/applications`),
    updateApplicationStatus: (id, data) => api.request('PUT', `/company/applications/${id}/status`, data),
    viewResumeUrl: (appId) => `${API_BASE}/company/applications/${appId}/resume`,

    studentDashboard: () => api.request('GET', '/student/dashboard'),
    updateStudentProfile: (data) => api.request('PUT', '/student/profile', data),
    uploadResume: (formData) => api.uploadFile('/student/profile/resume', formData),
    studentApplications: () => api.request('GET', '/student/applications'),
    applyForJob: (jobId) => api.request('POST', `/student/apply/${jobId}`),
    studentInterviews: () => api.request('GET', '/student/interviews'),
    studentPlacements: () => api.request('GET', '/student/placements'),
    offerLetterUrl: (placementId) => `${API_BASE}/student/placements/${placementId}/offer-letter`,

    listJobs: (params = '') => api.request('GET', `/jobs/${params}`),
    getJob: (id) => api.request('GET', `/jobs/${id}`),

    exportApplications: () => api.request('POST', '/export/applications'),
    exportPlacements: () => api.request('POST', '/export/placements'),
    generateReport: (companyId) => api.request('POST', `/export/report/${companyId}`),
    checkTaskStatus: (taskId) => api.request('GET', `/export/task-status/${taskId}`),
    downloadExportUrl: (filename) => {
        const token = api.getToken();
        const safeFile = encodeURIComponent(filename);
        if (token) {
            const safeToken = encodeURIComponent(token);
            return `${API_BASE}/export/download/${safeFile}?token=${safeToken}`;
        }
        return `${API_BASE}/export/download/${safeFile}`;
    },
};
