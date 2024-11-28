<script>
  import "./colorMenu.css";

  import { menuState } from "../../store/menuState.svelte.js";

  const palette1 = [
    "rgb(0,0,0)", // Black
    "rgb(128,128,128)", // Dark Gray
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
  ];
  const palette2 = [
    "rgb(255,255,255,0)", // tranparent
    "rgb(255,255,255)", // White
    "rgba(255, 174, 201, 1)", // Pink
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
  ];

  // Function to determine if a color is bright
  function isBrightColor(color) {
    // Extract the RGB values from the color string
    const rgbValues = color.match(/\d+/g).map(Number);
    // Calculate brightness using the RGB values of #E2E2E3
    const referenceBrightness = 226 * 0.299 + 226 * 0.587 + 227 * 0.114;
    const brightness =
      rgbValues[0] * 0.299 + rgbValues[1] * 0.587 + rgbValues[2] * 0.114;
    // Return true if brightness is greater than the reference brightness of #E2E2E3
    return brightness > referenceBrightness;
  }

  function onclickColorButton(buttonId) {
    if (buttonId == 0) {
      menuState.selectedColor = 0;
    } else {
      menuState.selectedColor = 1;
    }
  }

  function selectColor(color) {
    if (menuState.selectedColor == 0) {
      menuState.foregroundColor = color;
      window.globAppstate.selected_colors.foreground = color;
    } else {
      menuState.backgroundColor = color;
      window.globAppstate.selected_colors.background = color;
    }
  }
</script>

<div class="menu">
  <div class="flex">
    <button
      class="color-button"
      class:select={menuState.selectedColor == 0}
      on:click={() => {
        onclickColorButton(0);
      }}
    >
      <div class="foreground-color" style:box-shadow="inset 0 0 0 36px {menuState.foregroundColor}"></div>
      <p>색 1</p>
    </button>
    <button
      class="color-button"
      class:select={menuState.selectedColor == 1}
      on:click={() => {
        onclickColorButton(1);
      }}
    >
      <div class="background-color" style:box-shadow="inset 0 0 0 32px {menuState.backgroundColor}"></div>
      <p>색 2</p>
    </button>

    <div>
      <div>투명지우개</div>
    </div>
  </div>
  <div class="palette-area">
    <div class="flex">
      {#each palette1 as color}
        <button
          aria-label="choose color"
          class:bright_palette={isBrightColor(color)}
          class="palette-item"
          style="box-shadow: inset 0 0 0 36px {color};"
          on:click={() => {
            selectColor(color);
          }}
        ></button>
      {/each}
    </div>
    <div class="flex">
      {#each palette2 as color}
        <button
          aria-label="choose color"
          class:bright_palette={isBrightColor(color)}
          class="palette-item"
          style="box-shadow: inset 0 0 0 36px {color};"
          on:click={() => {
            selectColor(color);
          }}
        ></button>
      {/each}
    </div>
    <div class="flex">
      {#each Array.from({ length: palette1.length }) as _, index}
        {#if index < menuState.colorHistory.length}
          <button
            aria-label="choose color history"
            class:bright_palette={isBrightColor(color)}
            class="palette-item"
            style="box-shadow: inset 0 0 0 36px {menuState.colorHistory[
              index
            ]};"
            on:click={() => {
              selectColor(color);
            }}
          ></button>
        {:else}
          <div class="palette-item-none"></div>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .menu {
    width: 100%;
    padding: 12px;
    background: #fcfcfd;
  }

  .color-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 70px;
    height: 92px;
    background: #f3f3f4;
    padding: 9px;
    border-radius: 4px;
    margin-right: 12px;
    cursor: pointer;
    border: solid 1px #f3f3f4;
  }
  .color-button.select {
    background: #e2e2e3;
    border: solid 1px #8b8b8d;
  }
  .foreground-color {
    width: 36px;
    height: 36px;
    background: red;
    margin: 7px;
    border-radius: 4px;
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABlBMVEW9vb3///8EwsWUAAAADElEQVQI12NoYHAAAAHEAMFJRSpJAAAAAElFTkSuQmCC")
      repeat;
    background-size: 8px;
    image-rendering: pixelated;
  }
  .background-color {
    width: 32px;
    height: 32px;
    background: white;
    margin: 9px;
    border-radius: 4px;
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABlBMVEW9vb3///8EwsWUAAAADElEQVQI12NoYHAAAAHEAMFJRSpJAAAAAElFTkSuQmCC")
      repeat;
    background-size: 8px;
    image-rendering: pixelated;
  }

  .color-button > p {
    font-size: 14px;
  }

  .palette-area {
    margin-top: 16px;
    margin-bottom: 16px;
    background: #f3f3f4;
    padding: 4px;
    overflow-x: scroll;
  }
  .palette-area::-webkit-scrollbar {
    display: none;
  }
  .palette-item {
    width: 36px;
    height: 36px;
    margin: 2px;
    border-radius: 4px;
    flex-shrink: 0;
    cursor: pointer;
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABlBMVEW9vb3///8EwsWUAAAADElEQVQI12NoYHAAAAHEAMFJRSpJAAAAAElFTkSuQmCC")
      repeat;
    background-size: 8px;
    image-rendering: pixelated;
  }
  .palette-item-none {
    width: 36px;
    height: 36px;
    margin: 2px;
    border-radius: 4px;
    flex-shrink: 0;
    border: #e2e2e3 1px solid;
  }
  .bright_palette {
    border: #e2e2e3 1px solid;
  }
</style>
