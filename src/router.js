import Login from './Login.svelte';
import Home from './Home.svelte';
import About from './About.svelte';

const router = {
  '/': {
    view: Login,
    title: 'Login'
  },
  '/home': {
    view: Home,
    title: 'Home'
  },
  '/about': {
    view: About,
    title: 'About'
  }
}

export default router;