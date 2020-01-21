<script>
  import { onMount } from "svelte";

  import { user, token } from "../store.js";

  let threads = [];

  onMount(() => {
    fetch(`http://localhost:3000/thread/${$user._id}`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer: ${$token}`
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          error = result;
        } else {
          threads = result;
        }
      })
      .catch(e => console.log(e));
  });
</script>

<h1>Threads</h1>

{#if threads.length}
  {#each threads as thread}
    <p>Thread - {thread._id}</p>
  {/each}
{:else}
  <p>No threads</p>
{/if}
