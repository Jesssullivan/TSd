<script lang="ts">
  import { setLocale } from '@tinyland/tsd/svelte';
  import { page } from '$app/stores';
  
  export let data;
  
  // Reactively set locale based on URL parameter
  $: if (data.locale) {
    setLocale(data.locale);
  }
  
  // Also react to page changes
  $: if ($page.params.locale) {
    setLocale($page.params.locale);
  }
</script>

<slot />