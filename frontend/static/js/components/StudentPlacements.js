const StudentPlacements = {
    name: 'StudentPlacements',
    template: `
    <div class="container py-4 fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="section-header mb-0"><h4><i class="bi bi-trophy"></i> Placement History</h4></div>
            <router-link to="/student" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Dashboard</router-link>
        </div>
        <div v-if="loading" class="loading-container"><div class="spinner-border spinner-custom" role="status"></div></div>
        <div v-else-if="placements.length === 0" class="empty-state">
            <i class="bi bi-trophy"></i>
            <h5>No placements yet</h5>
            <p>Your placement history will appear here once you receive an offer.</p>
        </div>
        <div v-else class="row g-3">
            <div class="col-md-6" v-for="p in placements" :key="p.id">
                <div class="card shadow-sm p-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="fw-bold mb-0">[[ p.position || 'Position' ]]</h5>
                        <span class="badge bg-success">Offered</span>
                    </div>
                    <p class="text-primary mb-1"><i class="bi bi-building"></i> [[ p.company_name || '—' ]]</p>
                    <div class="row mt-2">
                        <div class="col-6">
                            <small class="text-muted d-block">Salary</small>
                            <strong v-if="p.salary" class="text-success"><i class="bi bi-currency-rupee"></i> [[ p.salary.toLocaleString() ]] LPA</strong>
                            <span v-else class="text-muted">—</span>
                        </div>
                        <div class="col-6">
                            <small class="text-muted d-block">Joining Date</small>
                            <strong v-if="p.joining_date">[[ formatDate(p.joining_date) ]]</strong>
                            <span v-else class="text-muted">To be decided</span>
                        </div>
                    </div>
                    <div v-if="p.offer_letter_path" class="mt-3 pt-3 border-top">
                        <button class="btn btn-outline-primary" @click="viewOfferLetter(p.id)">
                            <i class="bi bi-file-earmark-text me-2"></i> View Offer Letter
                        </button>
                        <button class="btn btn-outline-secondary ms-2" @click="downloadOfferLetter(p.id)">
                            <i class="bi bi-download me-2"></i> Download
                        </button>
                    </div>
                    <div v-else class="mt-2">
                        <small class="text-muted"><i class="bi bi-info-circle"></i> No offer letter available</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    delimiters: ['[[', ']]'],
    data() { return { placements: [], loading: true }; },
    methods: {
        formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; },
        async fetchPlacements() {
            this.loading = true;
            try {
                const res = await api.studentPlacements();
                this.placements = res.placements;
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },
        async viewOfferLetter(placementId) {
            try {
                const url = api.offerLetterUrl(placementId);
                const response = await fetch(url, {
                    headers: { 'Authorization': 'Bearer ' + store.state.token }
                });
                if (!response.ok) { alert('Failed to load offer letter'); return; }
                const blob = await response.blob();
                window.open(URL.createObjectURL(blob), '_blank');
            } catch (err) { alert('Failed to load offer letter'); }
        },
        async downloadOfferLetter(placementId) {
            try {
                const url = api.offerLetterUrl(placementId);
                const response = await fetch(url, {
                    headers: { 'Authorization': 'Bearer ' + store.state.token }
                });
                if (!response.ok) { alert('Failed to download offer letter'); return; }
                const blob = await response.blob();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'offer_letter.html';
                a.click();
            } catch (err) { alert('Failed to download offer letter'); }
        }
    },
    mounted() { this.fetchPlacements(); }
};
