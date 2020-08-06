<script>
  import { onMount } from "svelte";
  import Router, { link, location, push } from "svelte-spa-router";

  import routes from "./routes";
  import Login from "./Views/Login.svelte";
  import { user, isLoggedIn, token, alert } from "./store.js";
  import UserMessage from "./components/UserMessage.svelte";
  import Header from "./components/Header.svelte";
  import Navigation from "./components/Navigation.svelte";

  const syncLogOut = evt => {
    if (evt.key === "logout") {
      // remove token et al.
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("logout");
      // redirect to login
      push("/");
    }
  };

  const routeLoaded = () => {
    alert.set();
  };

  onMount(() => {
    if (!$user) {
      if (localStorage.getItem("user")) {
        user.set(JSON.parse(localStorage.getItem("user")));
      } else {
        push("/");
      }
    }
  });
</script>

<svelte:window on:storage={syncLogOut} />

<svelte:head>
  <title>Convo - {$location}</title>
</svelte:head>

<Header showNav={$isLoggedIn} />
{#if $isLoggedIn}
  <Navigation />
{/if}

<main id="pageContent">

  {#if $alert}
    <UserMessage />
  {/if}

  {#if $user}
    <Router {routes} on:routeLoaded={routeLoaded} />
  {:else}
    <Login />
  {/if}
</main>
