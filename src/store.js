import { writable } from 'svelte/store';

export const loggedIn = writable(false);
export const user = writable({});
export const isLoggedIn = writable(false);
export const token = writable('');