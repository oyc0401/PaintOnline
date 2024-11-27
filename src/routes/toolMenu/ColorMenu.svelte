<script>
  import "./colorMenu.css";
  // Child 컴포넌트의 value를 외부 컴포넌트에서 사용할 수 있도록 합니다.
  export let value;

  import { menuState } from "../../store/menuState.svelte.js";

  const palette = [
    "rgb(0,0,0)", // Black
    "rgb(128,128,128)", // Dark Gray
    "rgb(128,0,0)", // Dark Red
    "rgb(128,128,0)", // Pea Green
    "rgb(0,128,0)", // Dark Green
    "rgb(0,128,128)", // Slate
    "rgb(0,0,128)", // Dark Blue
    "rgb(128,0,128)", // Lavender
    "rgb(128,128,64)", //
    "rgb(0,64,64)", //
    "rgb(0,128,255)", //
    "rgb(0,64,128)", //
    "rgb(64,0,255)", //
    "rgb(128,64,0)", //
    "rgb(128,64,0,0.1)", // tranparent
    "rgb(128,64,0,0.2)", // tranparent

    "rgb(255,255,255)", // White
    "rgb(192,192,192)", // Light Gray
    "rgb(255,0,0)", // Bright Red
    "rgb(255,255,0)", // Yellow
    "rgb(0,255,0)", // Bright Green
    "rgb(0,255,255)", // Cyan
    "rgb(0,0,255)", // Bright Blue
    "rgb(255,0,255)", // Magenta
    "rgb(255,255,128)", //
    "rgb(0,255,128)", //
    "rgb(128,255,255)", //
    "rgb(128,128,255)", //
    "rgb(255,0,128)", //
    "rgb(255,128,64)", //
    "rgb(128,64,0,0.3)", // tranparent
    "rgb(128,64,0,0)", // tranparent
  ];
  
</script>
<div class='menu'>
  <div class="flex">
    <div class="color-button select">
      <div class="foreground-color"></div>
      <p>색 1</p>
     </div>
    <div class="color-button">
      <div class="background-color"></div>
      <p>색 2</p>
     </div>

    <div>
      <div>투명지우개</div>
    </div>
  </div>
</div>

<style>
  .menu {
    width:100%;
    padding:12px;
    background: #FCFCFD;
  }

  .color-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width:70px;
    height: 92px;
    background: #F3F3F4;
    padding: 10px;
    border-radius: 4px;
  }
  .color-button.select {
    background: #E2E2E3;
    border: solid 1px #8B8B8D;
  }
  .foreground-color {
    width: 36px;
    height: 36px;
    background: red;
    margin: 7px;
    border-radius: 4px;
  }
  .background-color {
    width: 32px;
    height: 32px;
    background: white;
    margin: 9px;
    border-radius: 4px;
  }
  
  .color-button > p {
    font-size: 14px;
  }
</style>