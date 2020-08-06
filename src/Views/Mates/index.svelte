<script>
  import { user, token, alert } from "../../store.js";

  import Input from "../../components/Input.svelte";
  import Button from "../../components/Button.svelte";
  import Article from "../../components/Article.svelte";

  let email = "";
  let searchResult;

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
          return alert.set({ message: result.message, type: "error" });
        }
        if (data._id === $user._id) {
          user.set(result);
          email = "";
        } else {
          searchResult = null;
        }
        alert.set({ message: "Request sent", type: "success" });
      })
      .catch(e => {
        alert.set({ message: e, type: "error" });
        console.log(e);
      });
  };

  const search = () => {
    if (!email) {
      return alert.set({
        message: "Please an email address",
        type: "error"
      });
    }

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
        if (result.statusCode) {
          return alert.set({ message: result.message, type: "error" });
        }
        searchResult = result;
      })
      .catch(e => {
        alert.set({ message: e, type: "error" });
        console.log(e);
      });
  };

  const updateRequest = (status, userId) => {
    fetch(`http://localhost:3001/user/mateRequest/${$user._id}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer: ${$token}`
      },
      body: JSON.stringify({ _id: userId, status: status })
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          return alert.set({ message: result.message, type: "error" });
        }
        alert.set({ message: `Request ${status}`, type: "success" });
        user.set(result);
      })
      .catch(e => {
        alert.set({ message: e, type: "error" });
        console.log(e);
      });
  };

  const sendRequest = () => {
    // grab user object, update to mates[{userId: $userId, requestId: $request, status: 'pending'}]
    const updatedUser = $user;
    const now = new Date();
    updatedUser.mates.unshift({
      _id: searchResult._id,
      status: "pending",
      firstName: searchResult.firstName,
      lastName: searchResult.lastName,
      displayName: searchResult.displayName,
      avatar: "/images/default-avatar.png",
      senderId: $user._id,
      createdAt: now,
      modifiedAt: now
    });
    searchResult.mates.unshift({
      _id: $user._id,
      status: "pending",
      firstName: $user.firstName,
      lastName: $user.lastName,
      displayName: $user.displayName,
      avatar: "/images/default-avatar.png",
      senderId: $user._id,
      createdAt: now,
      modifiedAt: now
    });
    // Update user
    updateUser(updatedUser);
    // Update request
    updateUser(searchResult);
  };
</script>

<h1>Mates</h1>
<p>Find a mate by searching for their email address.</p>

<form class="card">
  <Input
    type="email"
    name="email"
    labelText="Email"
    bind:value={email}
    required={false}
    hideLabel={true}
    placeholder="Email" />

  <Button type="submit" on:click={search} klass="primary" text="Search" />
  {#if searchResult}
    <Article data={searchResult} klass="searchResult">
      <slot>
        <Button
          type="button"
          on:click={sendRequest}
          klass="primary small inline right"
          text="Invite" />
      </slot>
    </Article>
  {/if}
</form>

<section class="mates">
  {#if $user.mates.length}
    {#each $user.mates as mate}
      <Article data={mate} klass="card">
        {#if mate.senderId != $user._id && mate.status === 'pending'}
          <slot>
            <Button
              type="button"
              on:click={e => updateRequest('accepted', mate._id)}
              klass="positive small inline right pill"
              text="Accept" />
            <Button
              type="button"
              on:click={e => updateRequest('declined', mate._id)}
              klass="negative small inline pill"
              text="Decline" />
          </slot>
        {/if}
      </Article>
    {/each}
  {:else}
    <p>No Mates</p>
  {/if}
</section>
