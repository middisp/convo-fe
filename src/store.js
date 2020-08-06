import { writable } from 'svelte/store';

export const loggedIn = writable(false);
export const user = writable();
export const isLoggedIn = writable(false);
export const token = writable('');
export const navOpen = writable(false);
export const alert = writable();

user.subscribe(value => {
  if (value) {
    localStorage.setItem('user', JSON.stringify(value));
  }
  else {
    localStorage.removeItem('user');
  }
});