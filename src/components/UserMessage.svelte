<script>
  import { alert } from "../store";
</script>

<style>
  aside {
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
    font-weight: 600;
    margin-bottom: 1.5rem;
    padding: 1rem 4rem 1rem 1rem;
    position: relative;
  }

  button {
    background-color: transparent;
    border: none;
    color: inherit;
    display: block;
    font-size: 2rem;
    height: 30px;
    line-height: 30px;
    padding: 0;
    position: absolute;
    right: 0.5rem;
    top: 50%;
    text-decoration: none;
    transform: translateY(-50%);
    -webkit-appearance: none;
    width: 30px;
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

  .info {
    background-color: var(--primaryLight);
    border: solid 2px var(--primary);
    color: var(--primary);
  }
</style>

<aside class={$alert.type}>
  <button on:click={() => alert.set()}>&times;</button>
  <p>{$alert.message}</p>
</aside>
