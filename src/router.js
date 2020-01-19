import Login from './Login.svelte';
import Threads from './Threads.svelte';
import About from './About.svelte';

const router = {
  '/': {
    view: Login,
    title: 'Login'
  },
  '/messages': {
    view: Threads,
    title: 'Threads'
  },
  '/about': {
    view: About,
    title: 'About'
  }
}

export default router;