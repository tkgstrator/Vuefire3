import { createRouter, createWebHistory } from "vue-router";
import Welcome from "../views/Welcome.vue";
import Present from "../views/Present.vue";

const routes = [
  {
    path: "/",
    name: "Welcome",
    component: Welcome,
  },
  {
    path: "/item",
    name: "Item",
    component: Present,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
