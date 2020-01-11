<script>
  import { createEventDispatcher } from "svelte";

  export let name;
  export let labelText;
  export let value;
  export let type = "text";
  export let error = false;

  const handleInput = e => {
    value = type.match(/^(number|range)$/) ? +e.target.value : e.target.value;
  };

  const handleBlur = e => {
    console.log((error = !e.target.value));
    error = !e.target.value;
  };
</script>

<style>
  input {
    display: block;
  }

  .error {
    border-color: red;
  }

  label.error {
    color: red;
  }
</style>

<label class={error ? 'error' : ''} for={name}>{labelText}</label>
<input
  class={error ? 'error' : ''}
  {name}
  {value}
  id={name}
  {type}
  on:input={handleInput}
  on:blur={handleBlur} />
