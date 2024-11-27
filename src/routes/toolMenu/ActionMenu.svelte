<script>


</script>
<div class='menuDropdown'>
  <div on:click={()=>{console.log('새창')}}>
    <p>새창</p>
  </div>
  <div on:click={()=>{console.log('열기')}}>
    <p>열기</p>
  </div>
  <div on:click={()=>{console.log('저장')}}>
    <p>저장</p>
  </div>
</div>

<style>
  .menu {
     position: absolute;
     background-color: #fff;
     border: 1px solid #ccc;
     padding: 8px;
     z-index: 10;
   }


  .selected-menu{
     background: gray;
  }

  .selected-tool{
    background: gray;
    font-weight: 700;
  }

</style>