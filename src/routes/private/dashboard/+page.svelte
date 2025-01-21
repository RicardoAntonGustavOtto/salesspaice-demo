<script lang="ts">
  import { Card, CardHeader, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Search } from "lucide-svelte";
  import type { PageData } from "./$types";

  interface TargetCompany {
    id: string;
    name: string;
    industry: string;
    logo_url?: string;
    notesCount: number;
    meetingsCount: number;
    lastActivity: string;
  }

  let { data } = $props<PageData>();
  let searchQuery = $state("");
  
  let companies = $derived<TargetCompany[]>(data.companies ?? []);
  let filteredCompanies = $derived(
    companies.filter(company => 
      company.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
</script>

<div class="container mx-auto p-6 space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-bold">Target Companies</h1>
    <Button variant="outline">Add Company</Button>
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