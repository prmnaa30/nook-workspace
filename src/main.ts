import { createApp } from "vue";
import "./assets/main.css";
import ui from "@nuxt/ui/vue-plugin";
import App from "./App.vue";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";

const router = createRouter({
  history: createMemoryHistory(),
  routes: [],
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ui);

app.mount("#app");
