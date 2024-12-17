<!-- @format -->
<script lang="ts">
  import type { PageDaLta } from "./$types.js";
  import Login from "./Login.svelte";
  export let data: PageData;
</script>

<div class="flex h-screen items-center justify-center">
  <div class="max-w-md flex-grow shadow rounded p-4">
    <h1 class="text-xl font-bold mb-4">Login</h1>
    <Login data={data.form} />
  </div>
</div>
