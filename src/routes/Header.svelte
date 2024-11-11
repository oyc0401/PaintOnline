<script>
 import './header.css';
 import LogoIcon from '$lib/images/logo.png';
    import UndoIcon from '$lib/images/undo.png';
    import RedoIcon from '$lib/images/redo.png';
    import MenuIcon from '$lib/images/menu.png';
    import SelectionIcon from '$lib/images/selection.png';
    import PenIcon from '$lib/images/pen.png';
   import BrushIcon from '$lib/images/brush.png';
    import RectangleIcon from '$lib/images/shape.png';
    import LineIcon from '$lib/images/line.png';
    import ColorIcon from '$lib/images/color.png';
    import FullScreenIcon from '$lib/images/full-screen.png';
   
   import { counter, counter2 } from '../store/appState.js';

   
</script>
<header>
   <div class="appbar">
      <div class='main-logo'>
         <img src={LogoIcon} alt="logo icon"/>
      </div>
      <p class='pl-2.5 text-md' >제목없음 그림판</p>
      <div class='flex-1'></div>
      <div class='history-button'>
         <img src={UndoIcon} alt="undo icon"/>
      </div>
      <div class='history-button'>
         <img src={RedoIcon} alt="redo icon"/>
      </div>
   </div>
   <div class="menus">
      <div class='menu-button'><img src={MenuIcon} alt="menu"/></div>
      <div class='menu-button'><img src={SelectionIcon} alt="selection"/></div>
      <div class='menu-button'><img src={PenIcon} alt="tools"/></div>
      <div class='menu-button'><img src={BrushIcon} alt="brush"/></div>
      <div class='menu-button'><img src={RectangleIcon} alt="shapes"/></div>
      <div class='menu-button'><img src={LineIcon} alt="line"/></div>
      <div class='menu-button'><img src={ColorIcon} alt="color"/></div>
      <div class='flex-1'></div>
      <div class='menu-button'><img src={FullScreenIcon} alt="full-screen"/></div>
   </div>
</header>


<style lang="postcss">

</style>