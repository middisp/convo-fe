<script>
  export let error;
  export let klass;
</script>

<style>
  aside {
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
    font-weight: 600;
    padding: 0.5em;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    /*transform: translate(0, 5px);
    animation: errorFade 0.3s ease-in-out forwards;*/
  }

  button {
    background-color: transparent;
    border: 0;
    color: inherit;
    display: block;
    font-size: 1.2em;
    position: absolute;
    right: 0.5em;
    top: 0.25em;
    text-decoration: none;
    -webkit-appearance: none;
  }

  p {
    margin: 0;
  }

  .error {
    background-color: var(--error);
    border: solid 2px var(--errorDark);
    color: var(--errorDark);
  }

  .success {
    background-color: var(--success);
    border: solid 2px var(--successDark);
    color: var(--successDark);
  }
</style>

<aside class={klass}>
  <button>&times;</button>
  <p>{error.statusCode}: {error.message || error}</p>
</aside>
