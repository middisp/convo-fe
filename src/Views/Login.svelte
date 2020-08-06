<script>
  import { push } from "svelte-spa-router";
  import { user, isLoggedIn, token, alert } from "../store.js";

  import Input from "../components/Input.svelte";
  import Button from "../components/Button.svelte";

  let email = "";
  let password = "";

  const saveToSession = data => {
    window.sessionStorage.setItem("token", data);
  };

  const login = () => {
    if (!email || !password) {
      return alert.set({
        message: "Please provide your login details",
        type: "error"
      });
    }
    fetch("http://localhost:3001/login", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          alert.set({ message: result.message, type: "error" });
        } else {
          user.set(result.user);
          token.set(result.token);
          saveToSession(result.token);
          isLoggedIn.set(true);
          push("/threads");
        }
      })
      .catch(e => {
        alert.set({ message: e, type: "error" });
        console.log(e);
      });
  };
</script>

<style>
  h1 {
    margin-top: 0;
  }
</style>

<h1>Hi!</h1>
<form action="post">
  <Input
    type="email"
    name="email"
    labelText="Email"
    bind:value={email}
    required="required" />
  <Input
    type="password"
    name="password"
    labelText="Password"
    bind:value={password}
    required="required" />
  <Button type="submit" on:click={login} klass="primary" text="Login" />
</form>
