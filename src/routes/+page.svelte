<!-- @format -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button/index.js";

  export let data;
  $: ({ supabase, user } = data);

  $: {
    console.log("Supabase client:", supabase);
    console.log("User data:", user);
  }
  function test() {
    console.log("Test function called");
  }
  async function logout() {
    console.log("Logout function called");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        return;
      }
      console.log("Logout successful");
      goto("/", { invalidateAll: true });
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }
</script>

<div class="flex flex-col items-center justify-center min-h-screen">
  {#if user}
    <p>Welcome, {user.email}!</p>
    <div class="flex gap-4">
      <Button onclick={() => goto("/private/events")}>Go to SalesSpace</Button>
      <Button onclick={() => logout()}>Logout</Button>
    </div>
  {:else}
    <Button onclick={() => goto("/login")}>Please Login</Button>
  {/if}
</div>
