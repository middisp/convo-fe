<script>
  import { user, token } from "../../store.js";

  import UserMessage from "../../components/UserMessage.svelte";
  import Input from "../../components/Input.svelte";
  import Button from "../../components/Button.svelte";

  let alert = {};
  let email = "";
  let searchResult;
  let mates = $user.mates;

  const updateUser = data => {
    fetch(`http://localhost:3001/user/update/${data._id}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer: ${$token}`
      },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          alert = { message: result.message, type: "error" };
        }
      })
      .catch(e => {
        alert = { message: e, type: "error" };
        console.log(e);
      });
  };

  const search = () => {
    fetch(`http://localhost:3001/user/find/`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer: ${$token}`
      },
      body: JSON.stringify({ email: email })
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode !== 200) {
          alert = { message: result.message, type: "error" };
        }
        searchResult = result;
      })
      .catch(e => {
        alert = { message: e, type: "error" };
        console.log(e);
      });
  };

  const sendRequest = () => {
    console.log("RequestSent");
    // grab user object, update to mates[{userId: $userId, requestId: $request, status: 'pending'}]
    const updatedUser = $user;
    updatedUser.mates.push({
      _id: searchResult._id,
      status: "pending",
      firstName: searchResult.firstName,
      lastName: searchResult.lastName,
      displayName: searchResult.displayName,
      avatar: "/images/default-avatar.png"
    });
    searchResult.mates.push({
      _id: $user._id,
      status: "pending",
      firstName: $user.firstName,
      lastName: $user.lastName,
      displayName: $user.displayName,
      avatar: "/images/default-avatar.png"
    });
    // Update user
    updateUser(updatedUser);
    // Update request
    updateUser(searchResult);
    // update localStorage
    user.set(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    searchResult = null;
    alert = { message: "Request sent", type: "success" };
  };
</script>

<style>
  .searchResults,
  .mates {
    margin-top: 1rem;
  }
  .searchResults,
  .mate {
    align-items: center;
    display: flex;
    padding: 1rem;
  }

  .detailWrap {
    padding-left: 1rem;
  }

  .detailWrap h1 {
    font-size: 2rem;
    margin: 0;
  }

  img {
    border-radius: 10px;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
    height: 4.5rem;
    width: 4.5rem;
  }

  .mate p {
    color: var(--bodyTextColorLight);
    font-size: 1.3rem;
  }

  .mate p + p {
    margin-top: 0.5rem;
  }
</style>

<h1>Mates</h1>
<p>Find a mate by searching for their email address.</p>

{#if alert.message}
  <UserMessage bind:alert />
{/if}

<form class="card userDetails">
  <Input
    type="email"
    name="email"
    labelText="Email"
    bind:value={email}
    required={false} />

  <Button type="submit" on:click={search} klass="primary" text="Search" />
</form>

{#if searchResult}
  <section class="card searchResults">
    <img
      src="/images/default-avatar.png"
      alt={`${searchResult.firstName} ${searchResult.lastName}`} />
    <div class="detailWrap">
      <h1>{searchResult.firstName} {searchResult.lastName}</h1>
      {#if searchResult.displayName !== ''}
        <p>{searchResult.displayName}</p>
      {/if}
    </div>
    <Button
      type="button"
      on:click={sendRequest}
      klass="primary small inline right"
      text="Invite" />
  </section>
{/if}

{#if mates.length}
  <section class="card mates">
    {#each mates as mate}
      <article class="mate">
        <img src={mate.avatar} alt={`${mate.firstName} ${mate.lastName}`} />
        <div class="detailWrap">
          <h1>{mate.firstName} {mate.lastName}</h1>
          {#if mate.displayName !== ''}
            <p>{mate.displayName}</p>
          {/if}
          {#if mate.status === 'pending'}
            <p>Status: {mate.status}</p>
          {/if}
        </div>
      </article>
    {/each}
  </section>
{:else}
  <p>No Mates</p>
{/if}
