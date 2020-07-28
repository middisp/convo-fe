import { wrap } from 'svelte-spa-router';

import Login from './Views/Login.svelte';
import Profile from './Views/Profile.svelte';
import Threads from './Views/Threads.svelte';
import Mates from './Views/Mates/index.svelte';
// import AddMate from './Views/Mates/add.svelte';


const routes = new Map();

routes.set('/', Login);
routes.set('/profile', Profile);
routes.set('/threads', Threads);
routes.set('/mates', Mates);
// routes.set('/mates/add', Mates);

export default routes