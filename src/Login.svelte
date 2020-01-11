<script>
  import { curRoute, user } from "./store.js";

  import Input from "./components/Input.svelte";

  let email = "";
  let password = "";

  const login = () => {
    // Handle validation
    console.log({ email, password });
    fetch("http://localhost:3000/login", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(result => {
        if (!result.statusCode) {
          return ($user = result);
        } else {
          throw new Error(result.message);
        }
        // Handle errors here
      })
      .then()
      .catch(e => console.log(e));
  };
</script>

<main>
  <h1>Hi!</h1>
  <form action="post">
    <Input type="text" name="email" labelText="email" bind:value={email} />
    <Input
      type="password"
      name="password"
      labelText="password"
      bind:value={password} />
    <button
      type="submit"
      on:click|preventDefault={login}
      disabled={!email.length && !password.length}>
      Login
    </button>
  </form>
</main>
