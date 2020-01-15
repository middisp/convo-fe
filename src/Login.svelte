<script>
  import { curRoute, user, isLoggedIn } from "./store.js";

  import Input from "./components/Input.svelte";
  import Button from "./components/Button.svelte";

  let email = "";
  let password = "";
  let error;

  const login = () => {
    if (!email || !password) {
      return (error = "Please provide your login details");
    }
    fetch("http://localhost:3000/login", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          error = result;
        } else {
          user.set(result);
          isLoggedIn.set(true);
          curRoute.set("/home");
          window.history.pushState(
            { path: "/home" },
            "",
            window.location.origin + "/home"
          );
        }
      })
      .catch(e => console.log(e));
  };
</script>

<main>
  <h1>Hi!</h1>
  {#if error}
    <div>{error.message || error}</div>
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
