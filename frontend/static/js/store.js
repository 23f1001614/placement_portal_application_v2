const store = {
    state: Vue.reactive({
        token: (function() {
            try {
                return localStorage.getItem('ppa_token') || sessionStorage.getItem('ppa_token') || '';
            } catch (e) {
                return sessionStorage.getItem('ppa_token') || '';
            }
        })(),
        user: (function() {
            try {
                return JSON.parse(localStorage.getItem('ppa_user') || sessionStorage.getItem('ppa_user') || 'null');
            } catch (e) {
                return JSON.parse(sessionStorage.getItem('ppa_user') || 'null');
            }
        })(),
    }),

    get isLoggedIn() {
        return !!this.state.token;
    },

    get role() {
        return this.state.user?.role || '';
    },

    login(token, user) {
        this.state.token = token;
        this.state.user = user;
        try {
            localStorage.setItem('ppa_token', token);
            localStorage.setItem('ppa_user', JSON.stringify(user));
        } catch (e) {
            sessionStorage.setItem('ppa_token', token);
            sessionStorage.setItem('ppa_user', JSON.stringify(user));
        }
    },

    logout() {
        this.state.token = '';
        this.state.user = null;
        try {
            localStorage.removeItem('ppa_token');
            localStorage.removeItem('ppa_user');
        } catch (e) {
            sessionStorage.removeItem('ppa_token');
            sessionStorage.removeItem('ppa_user');
        }
    },

    updateUser(user) {
        this.state.user = user;
        try {
            localStorage.setItem('ppa_user', JSON.stringify(user));
        } catch (e) {
            sessionStorage.setItem('ppa_user', JSON.stringify(user));
        }
    }
};


window.store = store;


function getToken() {
    return store.state.token;
}
