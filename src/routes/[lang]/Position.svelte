<script>
  import { onMount } from "svelte";
  import { PaintJSState } from "$paint/state";
  import { menuState } from "$store/menuState.svelte.js";
  import { reaction } from "mobx";

  const width = 234;
  let heigth = 54;

  onMount(() => {
    reaction(
      () => PaintJSState.position_mouse_x,
      (newValue) => {
        menuState.position_mouse.x = newValue;
      },
    );
    reaction(
      () => PaintJSState.position_mouse_y,
      (newValue) => {
        menuState.position_mouse.y = newValue;
      },
    );
    reaction(
      () => PaintJSState.position_mouse_active,
      (newValue) => {
        menuState.position_mouse_active = newValue;
      },
    );

    reaction(
      () => PaintJSState.position_canvas_x,
      (newValue) => {
        menuState.position_canvas.x = newValue;
      },
    );
    reaction(
      () => PaintJSState.position_canvas_y,
      (newValue) => {
        menuState.position_canvas.y = newValue;
      },
    );
    reaction(
      () => PaintJSState.position_canvas_active,
      (newValue) => {
        menuState.position_canvas_active = newValue;
      },
    );

    reaction(
      () => PaintJSState.position_object_x,
      (newValue) => {
        menuState.position_object.x = newValue;
      },
    );
    reaction(
      () => PaintJSState.position_object_y,
      (newValue) => {
        menuState.position_object.y = newValue;
      },
    );
    reaction(
      () => PaintJSState.position_object_active,
      (newValue) => {
        menuState.position_object_active = newValue;
      },
    );
  });
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
    top: 52px;

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
