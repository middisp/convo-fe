<script>
  import { curRoute, user, isLoggedIn, token } from "../store.js";

  import Input from "../components/Input.svelte";
  import Button from "../components/Button.svelte";
  import UserMessage from "../components/UserMessage.svelte";

  let email = "";
  let password = "";
  let alert;

  const saveToSession = data => {
    window.sessionStorage.setItem("token", data);
  };

  const login = () => {
    if (!email || !password) {
      return (error = "Please provide your login details");
    }
    fetch("http://localhost:3001/login", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          alert = { message: result.message, type: "error" };
        } else {
          user.set(result.user);
          isLoggedIn.set(true);
          curRoute.set("/threads");
          token.set(result.token);
          window.history.pushState(
            { path: "/threads" },
            "",
            window.location.origin + "/threads"
          );
        }
      })
      .catch(e => {
        alert = { message: e, type: "error" };
        console.log(e);
      });
  };
</script>

<style>
  h1 {
    margin-top: 0;
  }
</style>

<svelte:head>
  <title>Convo - login</title>
</svelte:head>

<h1>Hi!</h1>
{#if alert}
  <UserMessage bind:alert />
{/if}
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
  <Button
    type="submit"
    on:click={login}
    disabled={!email.length || !password.length}
    klass="primary"
    text="Login" />
</form>
