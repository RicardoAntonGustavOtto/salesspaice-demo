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

<h1>User Dashboard</h1>
{#if user}
  <p>Welcome, {user.email}!</p>
  <Button onclick={() => logout()}>Logout</Button>
{:else}
  <p>Please log in to view your dashboard.</p>
{/if}
