<script>
  import { user, token, alert } from "../store.js";

  import Input from "../components/Input.svelte";
  import Button from "../components/Button.svelte";
  import Toggle from "../components/Toggle.svelte";
  import UserMessage from "../components/UserMessage.svelte";

  let isEditable;
  let currentPassword = "";
  let newPassword = "";
  let confNewPassword = "";
  let updatedUser = $user;

  const save = () => {
    fetch(`http://localhost:3001/user/update/${updatedUser._id}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer: ${$token}`
      },
      body: JSON.stringify(updatedUser)
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          return alert.set({ message: result.message, type: "error" });
        }
        user.update(result => result);
        isEditable = false;
        alert.set({ message: "Update successful", type: "success" });
      })
      .catch(e => {
        alert.set({ message: e, type: "error" });
        console.log(e);
      });
  };

  const updatePassword = () => {
    if (!currentPassword || !newPassword || !confNewPassword) {
      return (error = { message: "Please provide passwords", type: "error" });
    }

    if (newPassword !== confNewPassword) {
      return (error = { message: "Passwords don't match", type: "error" });
    }
    fetch(`http://localhost:3001/login/updatePassword/${$user._id}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer: ${$token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    })
      .then(res => res.json())
      .then(result => {
        if (result.statusCode) {
          return alert.set({ message: result.message, type: "error" });
        }
        user.update(result => result);
        alert.set({ message: "Update successful", type: "success" });
      })
      .catch(e => {
        alert.set({ message: e, type: "error" });
        console.log(e);
      });
  };
</script>

<style>
  .userDetails {
    margin-top: 8em;
    padding: 6em 1em 1em;
    position: relative;
  }

  .passwordManagement {
    margin-top: 2em;
  }

  img {
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    margin: 0 auto;
    left: 50%;
    position: absolute;
    top: -100px;
    transform: translateX(-50%);
    max-width: 200px;
  }

  legend {
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
  }
</style>

{#if $user}
  <form class="card userDetails">
    <img src="/images/default-avatar.png" alt={updatedUser.name} />
    <Toggle name="edit" labelText="Edit" bind:value={isEditable} />
    <Input
      type="text"
      name="displayName"
      labelText="Display name"
      bind:value={updatedUser.displayName}
      disabled={!isEditable}
      required={false} />

    <Input
      type="text"
      name="firstName"
      labelText="First name"
      bind:value={updatedUser.firstName}
      disabled={!isEditable}
      required={false} />

    <Input
      type="text"
      name="lastName"
      labelText="Last name"
      bind:value={updatedUser.lastName}
      disabled={!isEditable}
      required={false} />

    <Input
      type="text"
      name="email"
      labelText="Email"
      bind:value={updatedUser.email}
      disabled={!isEditable}
      required={false} />

    {#if isEditable}
      <Button type="submit" on:click={save} klass="primary" text="Save" />
    {/if}
  </form>

  <form class="card passwordManagement">
    <legend>Password management</legend>
    <Input
      type="password"
      name="password"
      labelText="Current Password"
      bind:value={currentPassword}
      required={true} />

    <Input
      type="password"
      name="new-password"
      labelText="New Password"
      bind:value={newPassword}
      required={true} />

    <Input
      type="password"
      name="c-password"
      labelText="Confirm New Password"
      bind:value={confNewPassword}
      required={true} />

    <Button
      type="submit"
      on:click={updatePassword}
      klass="primary"
      text="Save" />
  </form>
{/if}
