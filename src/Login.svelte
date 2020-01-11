<script>
  import { curRoute, user } from "./store.js";

  import Input from "./components/Input.svelte";
  import Button from "./components/Button.svelte";

  let email = "";
  let password = "";

  const login = () => {
    // Handle validation
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
