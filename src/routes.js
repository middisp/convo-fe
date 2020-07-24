import { wrap } from 'svelte-spa-router';

import Login from './Views/Login.svelte';
import Profile from './Views/Profile.svelte';
import Threads from './Views/Threads.svelte';

const routes = new Map();

routes.set('/', Login);
routes.set('/profile', Profile);
routes.set('/threads', Threads);

export default routes