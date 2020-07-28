<script>
  import { onMount } from "svelte";
  import UserMessage from "../components/UserMessage.svelte";

  import { user, token } from "../store.js";

  let threads = [];
  let alert = {};

  onMount(() => {
    fetch(`http://localhost:3001/thread/${$user._id}`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer: ${$token}`
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          alert = { message: result.message, type: "error" };
        } else {
          threads = result;
        }
      })
      .catch(e => console.log(e));
  });
</script>

<h1>Threads</h1>
{#if alert.message}
  <UserMessage bind:alert />
{/if}

{#if threads.length}
  {#each threads as thread}
    <p>Thread - {thread._id}</p>
  {/each}
{:else}
  <p>No threads</p>
{/if}
