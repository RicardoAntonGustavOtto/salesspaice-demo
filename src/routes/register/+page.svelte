<!-- @format -->
<script lang="ts">
  import type { PageData } from "./$types.js";
  import Register from "./Register.svelte";
  export let data: PageData;
</script>

<div class="flex h-screen items-center justify-center">
  <div class="max-w-md flex-grow shadow rounded p-4">
    <h1 class="text-xl font-bold mb-4">Register</h1>
    <Register data={data.form} />
  </div>
</div>
