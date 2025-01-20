<script>
  import { menuState } from "$store/menuState.svelte.js";
</script>

<p class="position-area">
  {#if menuState.position_mouse_active}
    {menuState.position_mouse.x} x {menuState.position_mouse.y}
  {/if}
  {" / "}
  {#if menuState.position_canvas_active}
    {menuState.position_canvas.x} x {menuState.position_canvas.y}
  {/if}
  {" / "}
  {#if menuState.position_object_active}
    {menuState.position_object.x} x {menuState.position_object.y}
  {/if}
</p>

<style>
  .position-area {
    position: absolute;
    right: 8px;
    top: 48px;

    z-index: 9;

    color: rgba(25, 25, 25, 0.5);

    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -o-user-select: none;
    user-select: none;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
  }
</style>
