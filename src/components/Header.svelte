<script>
  export let showNav = false;
  export let toggleNav;

  const handleClick = () => {
    toggleNav = !toggleNav;
  };
</script>

<style>
  @keyframes bounce {
    0% {
      transform: translateY(0);
    }
    33% {
      transform: translateY(0);
    }
    66% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-2px);
    }
  }

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
    display: flex;
  }

  button {
    border: 0;
    background-color: transparent;
    color: inherit;
    display: flex;
    flex-direction: column;
    height: 35px;
    justify-content: space-between;
    margin-right: 0.5em;
    order: 1;
    padding: 0.5em 0;
    width: 30px;
  }

  button:focus {
    outline: none;
  }

  .bar {
    display: block;
    width: 100%;
    height: 3px;
    background-color: var(--secondary);
  }

  .dotAnim {
    display: flex;
    align-items: flex-end;
    margin-left: 5px;
  }

  .dot {
    display: block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: var(--secondary);
    margin-bottom: 6px;
  }

  .dot + .dot {
    margin-left: 2px;
  }

  .dot-one {
    animation: bounce 0.5s ease-in 0s alternate-reverse infinite;
  }
  .dot-two {
    animation: bounce 0.5s ease-in 0.15s alternate-reverse infinite;
  }
  .dot-three {
    animation: bounce 0.5s ease-in 0.25s alternate-reverse infinite;
  }
</style>

<header>
  <h1>
    Convo
    <span class="dotAnim">
      <span class="dot dot-one" />
      <span class="dot dot-two" />
      <span class="dot dot-three" />
    </span>
  </h1>
  {#if showNav}
    <button on:click={handleClick}>
      <div class="bar" />
      <div class="bar" />
      <div class="bar" />
    </button>
  {/if}
</header>
