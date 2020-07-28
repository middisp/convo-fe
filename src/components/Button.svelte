<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let disabled = false;
  export let type;
  export let text;
  export let klass;

  export let handleClick = () => {
    dispatch("click");
  };
</script>

<style>
  button {
    display: block;
    border-radius: 10px;
    -webkit-appearance: none;
    width: 100%;
    padding: 1rem;
    font-size: inherit;
    letter-spacing: inherit;
  }

  .primary {
    border: 0;
    color: #fff;
    background-color: var(--primary);
  }

  .small {
    font-size: 1.2rem;
    border-radius: 5px;
  }

  .inline {
    display: inline-block;
    width: auto;
  }

  .right {
    margin-left: auto;
  }
</style>

<button {type} class={klass} on:click|preventDefault={handleClick} {disabled}>
  {text}
</button>
