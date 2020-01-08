import Login from './Login.svelte';
import Home from './Home.svelte';
import About from './About.svelte';

import { writable } from 'svelte/store';

const router = {
  '/': Login,
  '/home': Home,
  '/about': About
}

export default router;

export const curRoute = writable('/');