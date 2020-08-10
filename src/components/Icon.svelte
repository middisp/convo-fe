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
    height: 25px;
  }

  .left {
    margin-right: 1rem;
  }

  .settings {
    background: transparent url("/images/icons.svg#settings") no-repeat 0 0;
  }

  .search {
    background: transparent url("/images/icons.svg#search") no-repeat 0 0;
  }

  .message {
    background: transparent url("/images/icons.svg#message") no-repeat 0 0;
  }

  .thread {
    background: transparent url("/images/icons.svg#thread") no-repeat 0 -80px;
  }

  .home {
    background: transparent url("/images/icons.svg#home") no-repeat 0 0;
  }

  .error {
    background: transparent url("/images/icons.svg#error") no-repeat 0 0;
  }

  .lock {
    background: transparent url("/images/icons.svg#lock") no-repeat 0 0;
  }

  .unlock {
    background: transparent url("/images/icons.svg#unlock") no-repeat 0 0;
  }

  .mates {
    background: transparent url("/images/icons.svg#mates") no-repeat 0 -205px;
  }

  .profile {
    background: transparent url("/images/icons.svg#profile") no-repeat 0 -229px;
  }

  .tick {
    background: transparent url("/images/icons.svg#tick") no-repeat 0 0;
  }
</style>

<i class={`icon ${icon} ${size} ${position}`} />
