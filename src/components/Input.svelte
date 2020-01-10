<script>
  export let type = "text";
  export let name;
  export let labelText;
  export let value = "";
  export let error = false;
</script>

<style>
  input {
    display: block;
  }

  .error {
    color: red;
    border-color: red;
  }
</style>

<label class={error ? 'error' : ''} for={name}>{labelText}</label>
<input class={error ? 'error' : ''} {name} {type} {value} />
