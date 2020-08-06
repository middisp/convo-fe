<script>
  import { push } from "svelte-spa-router";
  import RouterLink from "../components/RouterLink.svelte";
  import Button from "../components/Button.svelte";
  import { navOpen, user, isLoggedIn, alert } from "../store.js";

  const logout = () => {
    // remove token
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("logout");
    // redirect to login
    navOpen.set(false);
    isLoggedIn.set(false);
    user.set();
    alert.set();
    push("/");
  };
</script>

<style>
  nav {
    background-color: var(--primaryLight);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: calc(100vh - 53px);
    padding: 3rem 1.5rem;
    position: absolute;
    transition: transform 0.25s ease-out;
    transform: translate(-100%, 0);
    width: 50%;
    z-index: 1;
  }

  nav.show {
    transform: translate(0, 0);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    color: var(--primary);
  }

  li + li {
    margin-top: 0.5em;
  }
</style>

<nav class={$navOpen ? 'show' : ''}>
  <ul>
    <li>
      <RouterLink page={{ path: '/profile', name: 'Profile' }} />
    </li>
    <li>
      <RouterLink page={{ path: '/mates', name: 'Mates' }} />
    </li>
    <li>
      <RouterLink page={{ path: '/threads', name: 'Threads' }} />
    </li>
  </ul>
  <Button type="submit" on:click={logout} klass="primary" text="Logout" />
</nav>
