<!-- @format -->
<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import type { CompanyOption } from "../../../routes/register/schema";
  import { onMount } from "svelte";

  export let supabase: any;
  export let form: any;
  export let formData: any;

  let companies: CompanyOption[] = [];
  let searchQuery = "";
  let showNewCompanyInput = false;
  let loading = false;
  let error: string | null = null;

  $: filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function loadCompanies() {
    try {
      loading = true;
      error = null;
      const { data, error: supabaseError } = await supabase
        .from("owncompany")
        .select("id, name")
        .order('name');

      if (supabaseError) throw supabaseError;
      companies = data || [];
    } catch (err) {
      console.error("Error loading companies:", err);
      error = err instanceof Error ? err.message : "Failed to load companies";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadCompanies();
  });

  function handleCompanySelect(company: CompanyOption) {
    formData.companyId = company.id;
    formData.newCompanyName = "";
    showNewCompanyInput = false;
    searchQuery = company.name; // Update search query to show selected company
  }

  function toggleNewCompany() {
    showNewCompanyInput = !showNewCompanyInput;
    if (showNewCompanyInput) {
      formData.companyId = "";
      searchQuery = ""; // Clear search when switching to new company
    } else {
      formData.newCompanyName = "";
    }
  }
</script>

<div class="space-y-4">
  {#if error}
    <div class="text-sm text-destructive">{error}</div>
  {/if}

  <div class="flex flex-col gap-2">
    <Form.Field {form} name="companyId">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Select Company</Form.Label>
          <div class="relative">
            <Input
              type="text"
              bind:value={searchQuery}
              placeholder={loading ? "Loading companies..." : "Search existing companies..."}
              disabled={loading || showNewCompanyInput}
              class="mb-2"
            />
            {#if searchQuery && filteredCompanies.length > 0 && !showNewCompanyInput}
              <div class="absolute z-10 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {#each filteredCompanies as company}
                  <button
                    type="button"
                    class="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                    onclick={() => handleCompanySelect(company)}
                  >
                    {company.name}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  </div>

  <div class="flex items-center gap-2">
    <div class="flex-grow h-px bg-border"></div>
    <span class="text-sm text-muted-foreground">or</span>
    <div class="flex-grow h-px bg-border"></div>
  </div>

  <Button
    type="button"
    variant="outline"
    class="w-full"
    onclick={toggleNewCompany}
    disabled={loading}
  >
    {showNewCompanyInput ? "Select Existing Company" : "Create New Company"}
  </Button>

  {#if showNewCompanyInput}
    <Form.Field {form} name="newCompanyName">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>New Company Name</Form.Label>
          <Input
            {...props}
            type="text"
            bind:value={formData.newCompanyName}
            placeholder="Enter new company name"
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  {/if}
</div> 