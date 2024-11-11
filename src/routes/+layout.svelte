<script>
  import Header from './Header.svelte';
  import Colors from './Colors.svelte';
  import Footer from './Footer.svelte';
  import './styles.css';


  import { onMount } from 'svelte';
</script>

<div class="jspaints">
  <div class='vertical'>
    <Header></Header>
    <div class='horizontal'>



    </div>

    
  </div>
 
    <slot/>
  
  <div class='component-area bottom'></div>
  <div class='status-area'></div>
   <Colors>
    </Colors>
  <Footer>
  </Footer>
</div>

