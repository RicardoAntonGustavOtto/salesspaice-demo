<!-- @format -->
<script>
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  export let data;
  $: ({ supabase, user } = data);

  $: {
    console.log("Supabase client:", supabase);
    console.log("User data:", user);
  }

  let companies = [];
  let isLoading = true;
  let error = null;
  let showAddModal = false;
  let newCompany = {
    name: "",
    website: "",
  };

  async function loadCompanies() {
    try {
      isLoading = true;
      error = null;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("No user logged in");

      const { data, error: err } = await supabase
        .from("targetcompanies")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;
      companies = data;
    } catch (err) {
      console.error("Error loading companies:", err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadCompanies();
  });

  async function addCompany() {
    if (newCompany.name && newCompany.website) {
      try {
        error = null;
        isLoading = true;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) throw new Error("No user logged in");

        const { data, error: err } = await supabase
          .from("targetcompanies")
          .insert([
            {
              user_id: user.id,
              name: newCompany.name,
              website: newCompany.website,
            },
          ])
          .select()
          .single();

        if (err) throw err;

        companies = [...companies, data];
        closeModal();
      } catch (err) {
        console.error("Error adding company:", err);
        error = err.message;
      } finally {
        isLoading = false;
      }
    }
  }

  function closeModal() {
    showAddModal = false;
    newCompany = {
      name: "",
      website: "",
    };
  }

  async function goToCompany(company) {
    sessionStorage.setItem("selectedCompany", JSON.stringify(company));
    await goto(
      `/private/targetcompanyresearch/${encodeURIComponent(company.name.toLowerCase())}`
    );
  }
</script>

<div class="container mx-auto py-6 px-6 space-y-6">
  {#if companies.length === 0 && !isLoading}
    <div class="flex flex-col items-center justify-center min-h-[60vh]">
      <button
        on:click={() => (showAddModal = true)}
        class="border-2 border-dashed border-muted rounded-lg p-12 hover:border-muted/80 hover:bg-muted/5 transition-colors"
      >
        <span class="text-xl">+</span>
        <p class="mt-2 text-muted-foreground">
          No companies added yet. Click to add your first target company.
        </p>
      </button>
    </div>
  {:else}
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold tracking-tight">Target Companies</h1>
      <button
        on:click={() => (showAddModal = true)}
        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Add Company
      </button>
    </div>

    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-foreground" />
      </div>
    {:else if error}
      <div class="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
        {error}
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each companies as company}
          <div class="bg-card rounded-lg shadow-sm border border-border p-4 hover:shadow-md transition-all">
            <h3 class="font-semibold text-lg mb-2">{company.name}</h3>
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted-foreground hover:text-foreground transition-colors text-sm break-all"
            >
              {company.website}
            </a>
            <div class="mt-4">
              <button
                on:click={() => goToCompany(company)}
                class="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
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
