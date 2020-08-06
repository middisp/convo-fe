<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let disabled = false;
  export let type;
  export let text;
  export let klass;

  export const handleClick = () => dispatch("click");
</script>

<style>
  button {
    border-radius: 4px;
    border: 0;
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
    display: block;
    font-family: inherit;
    font-size: inherit;
    letter-spacing: 0.2px;
    -webkit-appearance: none;
    padding: 1rem;
    width: 100%;
  }

  button:hover {
    cursor: pointer;
  }

  .primary {
    color: #fff;
    background-color: var(--primary);
  }

  .negative {
    background-color: var(--error);
    color: var(--errorDark);
  }

  .positive {
    background-color: var(--success);
    color: var(--successDark);
  }

  .small {
    font-size: 1.2rem;
  }

  .inline {
    display: inline-block;
    width: auto;
  }

  .right {
    margin-left: auto;
  }

  .pill {
    border-radius: 5px 0 0 5px;
  }

  .pill + .pill {
    border-radius: 0 5px 5px 0;
  }
</style>

<button {type} class={klass} on:click|preventDefault={handleClick} {disabled}>
  {text}
</button>
