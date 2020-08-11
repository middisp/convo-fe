<script>
  export let icon;
  export let size = "med";
  export let position = "left";
</script>

<style>
  .icon {
    display: inline-block;
  }

  .med {
    width: 30px;
    height: 28px;
  }

  .left {
    margin-right: 1rem;
  }

  .settings {
    background: transparent url("/images/icons.svg#settings") no-repeat 50% 0;
  }

  .search {
    background: transparent url("/images/icons.svg#search") no-repeat 50% 0;
  }

  .message {
    background: transparent url("/images/icons.svg#message") no-repeat 50% 0;
  }

  .thread {
    background: transparent url("/images/icons.svg#thread") no-repeat 50% -91px;
  }

  .home {
    background: transparent url("/images/icons.svg#home") no-repeat 50% 0;
  }

  .error {
    background: transparent url("/images/icons.svg#error") no-repeat 50% 0;
  }

  .lock {
    background: transparent url("/images/icons.svg#lock") no-repeat 50% 0;
  }

  .unlock {
    background: transparent url("/images/icons.svg#unlock") no-repeat 50% 0;
  }

  .mates {
    background: transparent url("/images/icons.svg#mates") no-repeat 50% -120px;
  }

  .profile {
    background: transparent url("/images/icons.svg#profile") no-repeat 50% -151px;
  }

  .tick {
    background: transparent url("/images/icons.svg#tick") no-repeat 50% 0;
  }
</style>

<i class={`icon ${icon} ${size} ${position}`} />
