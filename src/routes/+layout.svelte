<script>
  import "../app.css";
   import "../paint.css";

  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

  injectSpeedInsights();

  import { onMount } from 'svelte';
</script>

<div class="paint-layout">

    <slot/>

</div>

