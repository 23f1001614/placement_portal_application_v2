const store = {
    state: Vue.reactive({
        token: localStorage.getItem('ppa_token') || '',
        user: JSON.parse(localStorage.getItem('ppa_user') || 'null'),
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
        localStorage.setItem('ppa_token', token);
        localStorage.setItem('ppa_user', JSON.stringify(user));
    },

    logout() {
        this.state.token = '';
        this.state.user = null;
        localStorage.removeItem('ppa_token');
        localStorage.removeItem('ppa_user');
    },

    updateUser(user) {
        this.state.user = user;
        localStorage.setItem('ppa_user', JSON.stringify(user));
    }
};


window.store = store;


function getToken() {
    return store.state.token;
}
