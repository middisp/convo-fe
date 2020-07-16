<script>
  export let name;
  export let labelText;
  export let value;
  export let type = "text";
  export let error = false;
  export let required;
  export let disabled = false;

  const handleInput = e => {
    value = type.match(/^(number|range)$/) ? +e.target.value : e.target.value;
  };

  const handleBlur = e => {
    error = !e.target.value;
  };
</script>

<style>
  input {
    background-color: var(--bodyBGColor);
    border: solid 1px var(--borderColor);
    border-radius: 10px;
    display: block;
    font-size: inherit;
    padding: 0.8rem;
    width: 100%;
    box-shadow: none;
  }

  input:focus {
    outline: 0;
  }

  label {
    display: block;
  }

  .error {
    border-color: var(--errorDark);
  }

  label.error {
    color: var(--errorDark);
  }

  label + input {
    margin-top: 1rem;
  }
  input + label,
  label + label {
    margin-top: 1.5rem;
  }
</style>

<label class={error ? 'error' : ''} for={name}>
  {labelText}{required ? '*' : ''}
</label>
<input
  class={error ? 'error' : ''}
  {name}
  {value}
  id={name}
  {type}
  on:input={handleInput}
  on:blur={handleBlur}
  {required}
  {disabled} />
