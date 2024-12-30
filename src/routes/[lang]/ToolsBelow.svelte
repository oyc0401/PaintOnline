<script>
  import "./toolsMenu.css";
  import BrushMenu from "./toolMenu/BrushMenu.svelte";
  import ShapeMenu from "./toolMenu/ShapeMenu.svelte";
  import ColorMenu from "./toolMenu/ColorMenu.svelte";
</script>

<header>
   <div class="menus">
      <BrushMenu/>
      <ShapeMenu/>
      <div class="flex-1"></div>
      <ColorMenu/>
   </div>

</header>