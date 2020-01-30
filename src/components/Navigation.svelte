<script>
  import RouterLink from "../components/RouterLink.svelte";
</script>

<style>
  nav {
    background-color: var(--primary);
    min-height: calc(100vh - 53px);
    padding: 0.5em;
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
    color: var(--secondary);
  }

  li + li {
    margin-top: 0.5em;
  }
</style>

<nav>
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
</nav>
