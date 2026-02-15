<template>
  <div id="app">
    <HeaderComponent />
    <main>
      <p>Welcome to vue</p>
    </main>
    <FooterComponent />
  </div>
</template>

<script>
  import HeaderComponent from './components/HeaderComponent.vue';
  import FooterComponent from './components/FooterComponent.vue';

  export default {
    name: 'App',
    components: {
      HeaderComponent,
      FooterComponent
    }
  };
  </script>