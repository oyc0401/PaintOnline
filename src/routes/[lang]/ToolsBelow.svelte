<script>
  import "./toolsMenu.css";
  import BrushMenu from "./toolMenu/BrushMenu.svelte";
  import ShapeMenu from "./toolMenu/ShapeMenu.svelte";
  import ColorMenu from "./toolMenu/ColorMenu.svelte";
  import EraserButton from "./toolMenu/EraserButton.svelte";
</script>

<header>
  <div class="menus">
    <BrushMenu>3</BrushMenu>
    <EraserButton>5</EraserButton>
    <ShapeMenu>4</ShapeMenu>
    <div class="flex-1"></div>
    <ColorMenu>6</ColorMenu>
  </div>
</header>
