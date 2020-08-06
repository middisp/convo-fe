<script>
  import { navOpen } from "../store.js";
  export let showNav = false;

  const handleClick = () => {
    navOpen.set(!$navOpen);
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
    background-color: var(--primary);
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.3);
    color: var(--secondary);
    display: flex;
    padding: 0.5em 0.5em;
    position: relative;
    width: 100%;
    z-index: 2;
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
    margin-right: 1em;
    order: 1;
    padding: 0.5em 0;
    width: 30px;
  }

  button:focus,
  button::-moz-focus-inner,
  button:active {
    outline: none;
    border: 0;
  }

  .bar {
    display: block;
    width: 100%;
    height: 3px;
    background-color: var(--secondary);
    opacity: 1;
    transition: all 0.25s linear;
  }

  button.open .bar-one {
    transform-origin: right center;
    transform: rotate(-41deg);
  }

  button.open .bar-two {
    opacity: 0;
  }

  button.open .bar-three {
    transform-origin: right center;
    transform: rotate(41deg);
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
    <button class={$navOpen ? 'open' : ''} on:click={handleClick}>
      <div class="bar bar-one" />
      <div class="bar bar-two" />
      <div class="bar bar-three" />
    </button>
  {/if}
</header>
