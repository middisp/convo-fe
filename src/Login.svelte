<script>
  import { curRoute, user } from "./store.js";

  import Input from "./components/Input.svelte";
  import Button from "./components/Button.svelte";

  let email = "";
  let password = "";
  let error;

  const login = () => {
    // Handle validation
    fetch("http://localhost:3000/login", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          error = result;
          throw new Error(result.message);
        }
        console.log(result);
        user.set(result);
      })
      .then(() => {
        curRoute.set("/home");
        window.history.pushState(
          { path: "/home" },
          "",
          window.location.origin + "/home"
        );
      })
      .catch(e => console.log(e));
  };
</script>

<main>
  <h1>Hi!</h1>
  {#if error}
    <div>{error.message}</div>
  {/if}
  <form action="post">
    <Input
      type="text"
      name="email"
      labelText="email"
      bind:value={email}
      required="required" />
    <Input
      type="password"
      name="password"
      labelText="password"
      bind:value={password}
      required="required" />
    <Button
      type="submit"
      on:click={login}
      disabled={!email.length || !password.length}
      text="Login" />
  </form>
</main>
