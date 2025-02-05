<script lang="ts">
  import { Card, CardHeader, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Search } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import type { PageData } from "./$types";

  interface TargetCompany {
    id: string;
    name: string;
    industry: string;
    logo_url?: string;
    notesCount: number;
    meetingsCount: number;
    lastActivity: string;
    website?: string;
  }

  let { data } = $props<{ data: PageData }>();
  let searchQuery = $state("");
  let showAddModal = $state(false);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let localCompanies = $state<TargetCompany[]>(data.companies ?? []);
  
  let newCompany = $state({
    name: "",
    website: ""
  });
  
  let companies = $derived(localCompanies);
  let filteredCompanies = $derived(
    companies.filter(company => 
      company.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  async function addCompany() {
    if (newCompany.name && newCompany.website) {
      try {
        error = null;
        isLoading = true;

        const { data: { user } } = await data.supabase.auth.getUser();
        if (!user?.id) throw new Error("No user logged in");

        const { data: newData, error: err } = await data.supabase
          .from("targetcompanies")
          .insert([
            {
              user_id: user.id,
              name: newCompany.name,
              website: newCompany.website
            },
          ])
          .select()
          .single();

        if (err) throw err;

        localCompanies = [...localCompanies, newData];
        closeModal();
      } catch (err) {
        console.error("Error adding company:", err);
        error = err instanceof Error ? err.message : "An error occurred";
      } finally {
        isLoading = false;
      }
    }
  }

  function closeModal() {
    showAddModal = false;
    newCompany = {
      name: "",
      website: ""
    };
    error = null;
  }
</script>

<div class="container mx-auto p-6 space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-bold">Target Companies</h1>
    <Button variant="outline" onclick={() => showAddModal = true}>Add Company</Button>
  </div>

  <div class="relative">
    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
    <input
      type="text"
      placeholder="Search companies..."
      bind:value={searchQuery}
      class="w-full pl-10 pr-4 py-2 border rounded-md"
    />
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredCompanies as company}
      <a href="/private/dashboard/{company.id}" class="block hover:opacity-90 transition-opacity">
        <Card class="h-full">
          <CardHeader>
            <div class="flex items-center space-x-4">
              {#if company.logo_url}
                <img src={company.logo_url} alt={company.name} class="w-12 h-12 object-contain" />
              {/if}
              <div>
                <h3 class="text-xl font-semibold">{company.name}</h3>
                <p class="text-sm text-muted-foreground">{company.industry}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Notes</span>
                <span class="font-medium">{company.notesCount ?? 0}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Meetings</span>
                <span class="font-medium">{company.meetingsCount ?? 0}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Last Activity</span>
                <span class="font-medium">{company.lastActivity ?? 'Never'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </a>
    {/each}
  </div>
</div>

<!-- Add Company Modal -->
{#if showAddModal}
  <div
    class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    transition:fade
    on:click|self={closeModal}
  >
    <div
      class="bg-card p-6 rounded-lg w-full max-w-md mx-4 shadow-lg"
      on:click|stopPropagation
    >
      <h2 class="text-xl font-semibold tracking-tight mb-4">Add New Target Company</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1" for="companyName">Company Name</label>
          <input
            type="text"
            id="companyName"
            bind:value={newCompany.name}
            class="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="companyWebsite">Company Website</label>
          <input
            type="text"
            id="companyWebsite"
            bind:value={newCompany.website}
            class="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {#if error}
          <div class="text-sm text-destructive">{error}</div>
        {/if}
        <div class="flex gap-3 mt-6">
          <button
            on:click={addCompany}
            disabled={isLoading}
            class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? '↻' : 'Add Company'}
          </button>
          <button
            on:click={closeModal}
            class="flex-1 px-4 py-2 border border-input bg-background text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} 