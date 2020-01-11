<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  export let disabled = "false";
  export let type;
  export let text;
  export let handleClick = () => {
    dispatch("click");
  };
</script>

<button {type} on:click|preventDefault={handleClick} {disabled}>{text}</button>
