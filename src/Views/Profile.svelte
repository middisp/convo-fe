<script>
  import { user } from "../store.js";

  import Input from "../components/Input.svelte";
  import Button from "../components/Button.svelte";
  import Toggle from "../components/Toggle.svelte";

  const save = () => {
    console.log("click");
  };

  let isEditable;
  let password = "";
  let confPassword = "";
</script>

<style>
  form {
    background: #fff;
    border: solid 1px var(--borderColor);
    border-radius: 10px;
    margin-top: 8em;
    padding: 6em 1em 1em;
    position: relative;
  }

  img {
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    margin: 0 auto;
    left: 50%;
    position: absolute;
    top: -20%;
    transform: translateX(-50%);
    max-width: 200px;
  }
</style>

{#if $user}
  <form>
    <img src="/images/default-avatar.png" alt={$user.name} />
    <Toggle name="edit" labelText="Edit" bind:value={isEditable} />
    <Input
      type="text"
      name="name"
      labelText="Name"
      value={$user.name}
      disabled={!isEditable}
      required={false} />

    <Input
      type="text"
      name="email"
      labelText="Email"
      value={$user.email}
      disabled={!isEditable}
      required={false} />

    <p>Update password</p>
    <Input
      type="password"
      name="password"
      labelText="Password"
      bind:value={password}
      required={false} />

    <Input
      type="text"
      name="c-password"
      labelText="Confirm password"
      bind:value={confPassword}
      required={false} />
    {#if isEditable}
      <Button type="submit" on:click={save} klass="primary" text="Save" />
    {/if}
  </form>
{/if}
