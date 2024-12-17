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

<div class="container mx-auto px-4 py-8">
  {#if companies.length === 0 && !isLoading}
    <div class="flex flex-col items-center justify-center min-h-[60vh]">
      <button
        on:click={() => (showAddModal = true)}
        class="border-2 border-dashed border-gray-200 rounded-lg p-12 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
      >
        <span class="text-xl">+</span>
        <p class="mt-2 text-gray-600">
          No companies added yet. Click to add your first target company.
        </p>
      </button>
    </div>
  {:else}
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-semibold">Target Companies</h1>
      <button
        on:click={() => (showAddModal = true)}
        class="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
      >
        Add Company
      </button>
    </div>

    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <div
          class="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-b-black"
        />
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    {:else}
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {#each companies as company}
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
          >
            <h3 class="font-semibold text-lg mb-2">{company.name}</h3>
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm break-all"
            >
              {company.website}
            </a>
            <div class="mt-4">
              <button
                on:click={() => goToCompany(company)}
                class="w-full px-3 py-2 text-sm border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
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
    class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
    transition:fade
    on:click|self={closeModal}
  >
    <div
      class="bg-white p-6 rounded-lg w-full max-w-md mx-4 shadow-lg"
      on:click|stopPropagation
    >
      <h2 class="text-xl font-semibold mb-4">Add New Target Company</h2>
      <div class="space-y-4">
        <div>
          <label
            class="block text-sm font-medium mb-1 text-gray-700"
            for="companyName">Company Name</label
          >
          <input
            type="text"
            id="companyName"
            bind:value={newCompany.name}
            class="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"
          />
        </div>
        <div>
          <label
            class="block text-sm font-medium mb-1 text-gray-700"
            for="companyWebsite">Company Website</label
          >
          <input
            type="text"
            id="companyWebsite"
            bind:value={newCompany.website}
            class="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"
          />
        </div>
        <div class="flex gap-3 mt-6">
          <button
            on:click={addCompany}
            disabled={isLoading}
            class="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              <span class="inline-block animate-spin">↻</span>
            {:else}
              Add Company
            {/if}
          </button>
          <button
            on:click={closeModal}
            class="flex-1 px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
