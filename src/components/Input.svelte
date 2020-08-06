<script>
  export let name;
  export let labelText;
  export let value;
  export let type = "text";
  export let error = false;
  export let required;
  export let disabled = false;
  export let hideLabel = false;
  export let placeholder;

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
    border-radius: 4px;
    display: block;
    font-size: inherit;
    padding: 0.8rem;
    width: 100%;
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3) inset;
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

  label.error,
  span.error {
    color: var(--errorDark);
  }

  span.error {
    font-size: 1.2rem;
  }

  label + input,
  span + input,
  label + span {
    margin-top: 0.5rem;
  }
  input + label,
  label + label {
    margin-top: 2rem;
  }
</style>

{#if !hideLabel}
  <label class={error ? 'error' : ''} for={name}>
    {labelText}{required ? '*' : ''}
  </label>
{/if}
{#if error}
  <span class="error">Required field</span>
{/if}
<input
  class={error ? 'error' : ''}
  {name}
  {value}
  id={name}
  {type}
  on:input={handleInput}
  on:blur={handleBlur}
  {required}
  {placeholder}
  {disabled} />
