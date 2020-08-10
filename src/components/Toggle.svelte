<script>
  export let name;
  export let labelText;
  export let value = false;
</script>

<style>
  input {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    position: absolute;
    padding: 0;
    width: 1px;
  }

  label {
    position: relative;
    width: 100%;
    display: block;
  }

  label:before,
  label:after {
    content: "";
    display: block;
    top: 0;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }

  label:before {
    background-color: var(--bodyBGColor);
    border: solid 1px var(--borderColor);
    border-radius: 15px;
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3) inset;
    height: 30px;
    width: 60px;
  }

  label:after {
    background-color: #ddd;
    border: solid 1px var(--borderColor);
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
    height: 25px;
    width: 25px;
    border-radius: 50%;
    position: absolute;
    right: 31px;
    transition: all 0.25s ease-in;
  }

  input:checked + label:after {
    background-color: var(--success);
    border: solid 1px var(--successDark);
    box-shadow: -1px 1px 3px rgba(0, 0, 0, 0.3);
    right: 3px;
  }
</style>

<input {name} id={name} type="checkbox" bind:checked={value} />
<label for={name}>{labelText}</label>
