<script>
  import { writable } from "svelte/store";
  import { curRoute } from "./router.js";

  let username = "";
  let password = "";

  const login = () => {
    fetch("localhost:3000/auth", {
      method: "post",
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json)
      .then(user => writable(user))
      .then(() => curRoute.set(window.location.pathname))
      .catch(e => console.log(`Err: ${e}`));
  };
</script>

<style>
  input {
    display: block;
  }
</style>

<main>
  <h1>Hi!</h1>
  <form action="post">
    <label for="username">email:</label>
    <input type="text" id="username" name="username" bind:value={username} />
    <label for="password">password:</label>
    <input
      type="password"
      id="password"
      name="password"
      bind:value={password} />
    <button type="submit" on:click|preventDefault={login}>Login</button>
  </form>
</main>
