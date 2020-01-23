import Login from './Views/Login.svelte';
import Threads from './Views/Threads.svelte';
import Profile from './Views/Profile.svelte';

const router = {
  '/': {
    view: Login,
    title: 'Login'
  },
  '/threads': {
    view: Threads,
    title: 'Threads'
  },
  '/profile': {
    view: Profile,
    title: 'Profile'
  }
}

export default router;