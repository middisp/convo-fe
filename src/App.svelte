<script>
  import { onMount } from "svelte";
  import Router, { link, location, push } from "svelte-spa-router";

  import routes from "./routes";
  import Login from "./Views/Login.svelte";
  import { user, isLoggedIn, token } from "./store.js";
  import Header from "./components/Header.svelte";
  import Navigation from "./components/Navigation.svelte";

  const syncLogOut = evt => {
    if (evt.key === "logout") {
      // remove token
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("logout");
      push("/");
      // redirect to login
    }
  };

  onMount(() => {
    if (!$user) {
      push("/");
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
  {#if $user}
    <Router {routes} />
  {:else}
    <Login />
  {/if}
</main>
