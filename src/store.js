import { writable } from 'svelte/store';

export const curRoute = writable('/');

export const loggedIn = writable(false);

export const user = writable({});