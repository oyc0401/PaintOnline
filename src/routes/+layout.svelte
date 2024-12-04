<svelte:head>
  <title>Paint Online</title>
  <meta name="description" content="이 페이지는 SvelteKit의 SEO 기능을 보여줍니다." />
  <meta property="og:title" content="SEO 친화적인 페이지" />
  <meta property="og:description" content="이 페이지는 SvelteKit의 SEO 기능을 보여줍니다." />
</svelte:head>

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

