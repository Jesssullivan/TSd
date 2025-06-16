declare module 'express' {
  const express: any;
  export default express;
}

declare module 'cors' {
  const cors: any;
  export default cors;
}

declare module '*.svelte' {
  import type { ComponentType } from 'svelte';
  const component: ComponentType;
  export default component;
}