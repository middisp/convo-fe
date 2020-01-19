<script>
  export let showNav = false;
</script>

<style>
  header {
    display: flex;
    width: 100%;
    background-color: var(--primary);
    color: var(--secondary);
    padding: 0.5em 0.5em;
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.3);
  }

  h1 {
    margin: 0;
    order: 2;
  }

  button {
    border: 0;
    background-color: transparent;
    color: inherit;
    order: 1;
  }
</style>

<header>
  <h1>
    Convo
    <span class="dotAnim">.</span>
  </h1>
  {#if showNav}
    <button>Menu</button>
  {/if}
</header>
