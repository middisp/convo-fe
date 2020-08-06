<script>
  import { formatDistance } from "date-fns";

  export let data;
  export let klass = "";
</script>

<style>
  .searchResult,
  .card {
    margin-top: 3rem;
    align-items: center;
    display: flex;
  }

  .card {
    padding: 1.6rem;
  }

  .card:first-of-type {
    border-radius: 8px 8px 0 0;
    border-bottom: 0;
  }
  .card + .card {
    border-top: 0;
    border-radius: 0;
    border-bottom: 0;
    margin-top: 0;
  }
  .card:last-child {
    border-radius: 0 0 8px 8px;
    border-bottom: 1px solid var(--borderColor);
  }

  .card:only-of-type {
    border-radius: 8px;
    border-bottom: 1px solid var(--borderColor);
  }

  .detailWrap {
    padding-left: 1rem;
  }

  .detailWrap h1 {
    font-size: 2rem;
    letter-spacing: 0;
    margin: 0;
  }

  img {
    border-radius: 4px;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
    height: 5rem;
    width: 5rem;
  }

  .tag,
  p {
    font-size: 1.1rem;
    margin: 0.5rem 0 0;
  }

  .tag {
    border-radius: 2px;
    display: inline-block;
    padding: 0.3rem;
  }

  .tag.pending {
    background-color: var(--warn);
    color: var(--warnDark);
  }

  .tag.accepted {
    background-color: var(--success);
    color: var(--successDark);
  }

  .tag.rejected {
    background-color: var(--error);
    color: var(--errorDark);
  }
</style>

<article class={klass}>
  <img
    src={data.avatar || '/images/default-avatar.png'}
    alt={`${data.firstName} ${data.lastName}`} />
  <div class="detailWrap">
    <h1>{data.firstName} {data.lastName}</h1>
    {#if data.status === 'accepted'}
      <p>
        Since: {formatDistance(new Date(data.modifiedAt), new Date(), { addSuffix: true })}
      </p>
    {:else}
      <p class={`tag ${data.status}`}>{data.status}</p>
    {/if}
  </div>
  <slot />
</article>
