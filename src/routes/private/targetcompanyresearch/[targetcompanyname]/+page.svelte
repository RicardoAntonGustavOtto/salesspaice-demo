<!-- @format -->
<script lang="ts">
  import { page } from "$app/stores";
  import { fade } from "svelte/transition";
  import { browser } from "$app/environment";
  import { marked } from "marked";
  import { onMount } from "svelte";
  import { enhance } from "$app/forms";
  import { callProxy } from "$lib/services/apiService";
  import { goto } from "$app/navigation";
  import { ownCompany } from "$lib/stores/ownCompany";
  import { getPrompt } from "$lib/services/promptManager";
  import * as pdfjs from "pdfjs-dist";
  import EditProspectModal from "$lib/components/edit-prospect-modal.svelte";
  import ResearchList from "$lib/components/research/ResearchList.svelte";
  import ResearchModal from "$lib/components/research/ResearchModal.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import { cn } from "$lib/utils";
  import type { ProspectProps, NewProspectProps } from "$lib/types/prospect";
  import type { 
    Company, 
    PageData, 
    ResearchResult, 
    AnnualReport, 
    ColdCallingGuide,
    EmailDraft 
  } from "$lib/types/company";

  // Add type for AI response
  interface AIResponse {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
    citations?: string[];
  }

  // Update ModelProvider type to match apiService
  type ModelProvider = import("$lib/services/apiService").ModelProvider;

  export let data: PageData;
  let company = data.company as Company & {
    cold_email_drafts?: EmailDraft[];
    cold_calling_guides?: ColdCallingGuide[];
  };
  let isLoading = true;
  let error: string | null = null;
  let show = false;
  let editedContent = "";

  // Update company when data changes
  $: {
    if (data.company) {
      company = data.company as Company & {
        cold_email_drafts?: EmailDraft[];
        cold_calling_guides?: ColdCallingGuide[];
      };
      isLoading = false;
      error = null;
    } else {
      error = "Company not found";
      isLoading = false;
    }
  }

  let loading = false;
  let showResearchModal = false;
  let researchLoading = false;
  let researchResult = "";
  let selectedResearchIndex: number | null = null;

  // Tab management
  let activeTab = 'overview';
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'research', label: 'Research' },
    { id: 'prospects', label: 'Prospects' },
    { id: 'annual-reports', label: 'Annual Reports' },
    { id: 'cold-calling', label: 'Cold Calling Guide' },
    { id: 'email-drafts', label: 'Email Drafts' }
  ] as const;

  // Error handling helper
  function handleError(err: unknown): string {
    console.error("Error:", err);
    return err instanceof Error ? err.message : "Unknown error occurred";
  }

  async function handleResearchView({ detail }: CustomEvent<{ research: ResearchResult, index: number }>) {
    showResearchModal = true;
    editedContent = detail.research.research_content;
    selectedResearchIndex = detail.index;
  }

  async function handleResearchDelete({ detail }: CustomEvent<{ index: number }>) {
    if (!confirm("Are you sure you want to delete this research?")) return;

    try {
      const currentResearch = company.research_result || [];
      const updatedResearch = [...currentResearch];
      updatedResearch.splice(detail.index, 1);

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          research_result: updatedResearch,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
    } catch (err) {
      error = handleError(err);
    }
  }

  async function handleResearchSave({ detail }: CustomEvent<{ content: string }>) {
    if (!company || !detail.content || selectedResearchIndex === null) return;

    try {
      loading = true;
      error = null;

      const currentResearch = company.research_result || [];
      const updatedResearch = [...currentResearch];
      updatedResearch[selectedResearchIndex] = {
        ...updatedResearch[selectedResearchIndex],
        research_content: detail.content,
        research_date: new Date().toISOString(),
      };

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          research_result: updatedResearch,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
      showResearchModal = false;
    } catch (err) {
      error = handleError(err);
    } finally {
      loading = false;
    }
  }

  // State variables
  let showProspectModal = false;
  let showAnnualReportModal = false;
  let selectedResearch: ResearchResult | null = null;
  let selectedReport: string | null = null;
  let selectedProspect: ProspectProps | null = null;
  let selectedEmailResearch: ResearchResult | null = null;
  let selectedEmailReport: string | null = null;
  let selectedEmailGuide: ColdCallingGuide | null = null;
  let searchQuery = "";
  let showEmailDraftsModal = false;
  let selectedProspectForDrafts: ProspectProps | null = null;
  let showColdCallingModal = false;
  let selectedProspectForGuides: ProspectProps | null = null;
  let showProspectProfileModal = false;
  let selectedProspectForProfile: ProspectProps | null = null;

  // Prospect handlers
  async function handleProspectSave({ detail }: CustomEvent<NewProspectProps>) {
    if (!company) return;

    try {
      loading = true;
      error = null;

      const currentProspects = company.prospects || [];
      const updatedProspects = selectedProspect
        ? currentProspects.map(p => p.id === selectedProspect?.id ? { ...p, ...detail } : p)
        : [...currentProspects, { ...detail, id: crypto.randomUUID() }];

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          prospects: updatedProspects,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
      showProspectModal = false;
      selectedProspect = null;
    } catch (err) {
      error = handleError(err);
    } finally {
      loading = false;
    }
  }

  async function handleProspectDelete(prospect: ProspectProps) {
    if (!confirm("Are you sure you want to delete this prospect?")) return;

    try {
      const currentProspects = company.prospects || [];
      const updatedProspects = currentProspects.filter(p => p.id !== prospect.id);

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          prospects: updatedProspects,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
    } catch (err) {
      error = handleError(err);
    }
  }

  async function handleProspectEdit(prospect: ProspectProps) {
    selectedProspect = prospect;
    showProspectModal = true;
  }

  // Annual Report handlers
  async function handleAnnualReportSave(report: AnnualReport) {
    if (!company) return;

    try {
      loading = true;
      error = null;

      const currentReports = company.annual_report || [];
      const updatedReports = [...currentReports, report];

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          annual_report: updatedReports,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
      showAnnualReportModal = false;
    } catch (err) {
      error = handleError(err);
    } finally {
      loading = false;
    }
  }

  async function handleAnnualReportDelete(report: AnnualReport) {
    if (!confirm("Are you sure you want to delete this annual report?")) return;

    try {
      const currentReports = company.annual_report || [];
      const updatedReports = currentReports.filter((r: AnnualReport) => r.year !== report.year);

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          annual_report: updatedReports,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
    } catch (err) {
      error = handleError(err);
    }
  }

  // Cold Calling Guide handlers
  async function handleGenerateColdCallingGuide() {
    if (!company?.name || !company?.website || !selectedProspect) {
      error = "Company information or prospect is missing";
      return;
    }

    try {
    loading = true;
    error = null;

      // Get the selected research
      const latestResearch = company.research_result?.[company.research_result.length - 1];
      if (!latestResearch) {
        throw new Error("No research results found. Please generate research first.");
      }

      // Create the variables object with all required fields
      const promptVariables = {
        prospect_name: selectedProspect.name,
        targetcompany_name: company.name,
        targetcompany_website: company.website,
        owncompany_name: $ownCompany.name,
        owncompany_info: $ownCompany.info,
        targetcompany_research_result: latestResearch.research_content,
        prospect_info: `Name: ${selectedProspect.name}
Title: ${selectedProspect.title}
Email: ${selectedProspect.email || 'N/A'}
Phone: ${selectedProspect.phone || 'N/A'}
Notes: ${selectedProspect.notes || 'N/A'}`
      };

      // Debug log
      console.log("Prompt Variables:", promptVariables);

      const { prompt, model, provider } = getPrompt("prospecting_email", promptVariables);

      // Debug log
      console.log("Generated Prompt:", prompt);

      const response = await callProxy(prompt, provider as ModelProvider, model);
      const guideContent = typeof response === 'string' ? response : (response as unknown as AIResponse).choices?.[0]?.message?.content;

      if (!guideContent) {
        throw new Error('Failed to generate guide content');
      }

      const guide = {
        id: crypto.randomUUID(),
        prospect: selectedProspect,
        content: guideContent,
        generated_at: new Date().toISOString(),
      };

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          cold_calling_guides: [...(company.cold_calling_guides || []), guide],
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
      showColdCallingModal = true;
      selectedProspectForGuides = selectedProspect;
    } catch (err) {
      error = handleError(err);
      console.error("Cold calling guide generation failed:", err);
    } finally {
      loading = false;
    }
  }

  // Email Draft handlers
  async function handleGenerateEmailDraft(prospect: ProspectProps) {
    if (!company?.name || !company?.website) {
      error = "Company information is missing";
      return;
    }

    try {
      loading = true;
      error = null;

      // Create the variables object with all required fields
      const promptVariables = {
        prospect_name: prospect.name,
        targetcompany_name: company.name,
        targetcompany_website: company.website,
        targetcompany_description: company.description || '',
        targetcompany_annualreport: selectedEmailReport || "",
        targetcompany_research: selectedEmailResearch?.research_content || "",
        targetcompany_coldcallingguide: selectedEmailGuide?.content || "",
        prospect_info: `Name: ${prospect.name}
             Title: ${prospect.title}
             Email: ${prospect.email}
             Phone: ${prospect.phone}
             Notes: ${prospect.notes}`,
        owncompany_name: $ownCompany.name
      };

      // Debug log
      console.log("Prompt Variables:", promptVariables);

      const { prompt, model, provider } = getPrompt("prospecting_email", promptVariables);

      // Debug log
      console.log("Generated Prompt:", prompt);

      const response = await callProxy(prompt, provider as ModelProvider, model);
      const emailContent = typeof response === 'string' ? response : (response as unknown as AIResponse).choices?.[0]?.message?.content;

      if (!emailContent) {
        throw new Error('Failed to generate email content');
      }

      const draft = {
        id: crypto.randomUUID(),
        prospect,
        content: emailContent,
        generated_at: new Date().toISOString()
      };

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          cold_email_drafts: [...(company.cold_email_drafts || []), draft],
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
    } catch (err) {
      error = "Failed to generate email draft. Please try again.";
      console.error("Email draft generation failed:", err);
    } finally {
      loading = false;
    }
  }

  function getProspectDraftsCount(prospectId: string): number {
    if (!company?.cold_email_drafts) return 0;
    return company.cold_email_drafts.filter(d => d?.prospect?.id === prospectId).length;
  }

  function getProspectGuidesCount(prospectId: string): number {
    if (!company?.cold_calling_guides) return 0;
    return company.cold_calling_guides.filter(d => d?.prospect?.id === prospectId).length;
  }

  async function handleEmailDraftDelete(draftId: string) {
    if (!confirm("Are you sure you want to delete this email draft?")) return;

    try {
      if (!company?.cold_email_drafts) return;
      const updatedDrafts = company.cold_email_drafts.filter(d => d.id !== draftId);

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          cold_email_drafts: updatedDrafts,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;
      company = updatedCompany as Company & {
        cold_email_drafts?: EmailDraft[];
        cold_calling_guides?: ColdCallingGuide[];
      };
    } catch (err) {
      error = handleError(err);
    }
  }

  async function handleGuideDelete(guideId: string) {
    if (!confirm("Are you sure you want to delete this guide?")) return;

    try {
      if (!company?.cold_calling_guides) return;
      const updatedGuides = company.cold_calling_guides.filter(d => d.id !== guideId);

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          cold_calling_guides: updatedGuides,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;
      company = updatedCompany as Company & {
        cold_email_drafts?: EmailDraft[];
        cold_calling_guides?: ColdCallingGuide[];
      };
    } catch (err) {
      error = handleError(err);
    }
  }

  async function handleAIResearch() {
    if (!company?.name || !company?.website) {
      error = "Company information is missing";
      return;
    }

    researchLoading = true;
    error = null;

    try {
      const { prompt, model, provider } = getPrompt("research_targetcompany", {
        targetcompany_name: company.name,
        targetcompany_website: company.website,
        targetcompany_description: company.description || '',
      });

      // Debug log
      console.log("Generated Prompt:", prompt);

      const response = await callProxy(prompt, provider as ModelProvider, model);
      const research = typeof response === 'string' ? { choices: [{ message: { content: response } }] } : response as unknown as AIResponse;
      
      if (!research.choices?.[0]?.message?.content) {
        throw new Error('Unexpected response from AI service');
      }

      const researchContent = research.choices[0].message.content;

      const newResearch = {
        research_date: new Date().toISOString(),
        research_content: researchContent,
        citations: research.citations || [],
      };

      const currentResearch = company.research_result || [];
      const updatedResearch = [...currentResearch, newResearch];

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
                                .from("targetcompanies")
                                .update({
                                  research_result: updatedResearch,
                                })
                                .eq("id", company.id)
                                .select()
                                .single();

                            if (updateError) throw updateError;

      company = updatedCompany as Company & {
        cold_email_drafts?: EmailDraft[];
        cold_calling_guides?: ColdCallingGuide[];
      };
      researchResult = researchContent;
      editedContent = researchContent;
                          } catch (err) {
      error = handleError(err);
      console.error("AI Research failed:", err);
    } finally {
      researchLoading = false;
    }
  }

  // Add state for edit mode
  let editMode = false;
  let editedName = '';
  let editedWebsite = '';

  // Function to handle edit mode
  function startEdit() {
    editMode = true;
    editedName = company.name;
    editedWebsite = company.website || '';
  }

  // Function to save company changes
  async function saveCompanyChanges() {
    try {
      loading = true;
      error = null;

      const { data: updatedCompany, error: updateError } = await $page.data.supabase
        .from("targetcompanies")
        .update({
          name: editedName,
          website: editedWebsite,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
      editMode = false;
    } catch (err) {
      error = handleError(err);
    } finally {
      loading = false;
    }
  }

  // Computed properties for status indicators
  $: hasResearch = (company?.research_result?.length ?? 0) > 0;
  $: hasProspects = (company?.prospects?.length ?? 0) > 0;
  $: hasColdCallingGuides = (company?.cold_calling_guides?.length ?? 0) > 0;
  $: hasEmailDrafts = (company?.cold_email_drafts?.length ?? 0) > 0;

  $: show = showResearchModal;
</script>

<div class="container mx-auto p-6 max-w-7xl">
  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-foreground"></div>
                  </div>
  {:else if error}
    <div class="text-center text-destructive p-4" transition:fade>
      {error}
                </div>
  {:else if !company}
    <div class="text-center text-muted-foreground p-4" transition:fade>
      Company not found
              </div>
          {:else}
    <div transition:fade>
      <!-- Company Header -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle class="flex justify-between items-start">
            <div class="flex-1">
              {#if editMode}
                <div class="space-y-2">
                  <input
                    type="text"
                    bind:value={editedName}
                    class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-2xl font-bold"
                    placeholder="Company Name"
                  />
                  <input
                    type="text"
                    bind:value={editedWebsite}
                    class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Website URL"
                  />
                  <div class="flex gap-2">
                    <Button variant="outline" size="sm" onclick={() => editMode = false}>
                      Cancel
                    </Button>
                    <Button variant="default" size="sm" onclick={saveCompanyChanges} disabled={loading}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              {:else}
                <div class="flex items-center gap-2">
                  <h1 class="text-3xl font-bold">{company.name}</h1>
                  <button
                    class="text-muted-foreground hover:text-foreground"
                    onclick={startEdit}
                    title="Edit company details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                </div>
                {#if company.website}
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-muted-foreground hover:text-foreground transition-colors mt-2 inline-block"
                  >
                    {company.website}
                  </a>
                {/if}
              {/if}
            </div>
            <div class="flex gap-3 items-center">
              <div class="flex items-center gap-1" title="Research">
                <span class="text-sm">Research</span>
                <div class={cn(
                  "w-2 h-2 rounded-full",
                  hasResearch ? "bg-green-500" : "bg-red-500"
                )}></div>
              </div>
              <div class="flex items-center gap-1" title="Prospects">
                <span class="text-sm">Prospects</span>
                <div class={cn(
                  "w-2 h-2 rounded-full",
                  hasProspects ? "bg-green-500" : "bg-red-500"
                )}></div>
              </div>
              <div class="flex items-center gap-1" title="Cold Calling Guides">
                <span class="text-sm">CCG</span>
                <div class={cn(
                  "w-2 h-2 rounded-full",
                  hasColdCallingGuides ? "bg-green-500" : "bg-red-500"
                )}></div>
              </div>
              <div class="flex items-center gap-1" title="Email Drafts">
                <span class="text-sm">Emails</span>
                <div class={cn(
                  "w-2 h-2 rounded-full",
                  hasEmailDrafts ? "bg-green-500" : "bg-red-500"
                )}></div>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <!-- Tabs -->
      <Tabs value={activeTab} onValueChange={(value: string) => activeTab = value} class="w-full">
        <TabsList class="w-full justify-start">
          {#each tabs as tab}
            <TabsTrigger value={tab.id}>{tab.label}</TabsTrigger>
          {/each}
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Company Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="prose dark:prose-invert">
                {#if company.description}
                  {@html marked(typeof company.description === 'string' ? company.description : '')}
          {:else}
                  <p class="text-muted-foreground">No company description available.</p>
          {/if}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research">
          <Card>
            <CardHeader>
              <CardTitle>Research</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <ResearchList 
                researchResults={company.research_result || []}
                onview={handleResearchView}
                ondelete={handleResearchDelete}
              />
              
              <Button
                onclick={handleAIResearch}
                variant="outline"
                disabled={researchLoading}
                class="w-full"
              >
                {#if researchLoading}
                  <div class="animate-spin rounded-full h-4 w-4 border-2 border-muted border-t-foreground mr-2"></div>
            {/if}
                {researchLoading ? 'Researching...' : 'Do AI Research'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prospects">
          <Card>
            <CardHeader>
              <CardTitle class="flex justify-between items-center">
                <span>Prospects</span>
                <Button onclick={() => {
                  selectedProspect = null;
                  showProspectModal = true;
                }} variant="default">
                  Add Prospect
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
          {#if company.prospects && company.prospects.length > 0}
                <div class="space-y-4">
                  <!-- Search input -->
                  <div class="relative">
                    <input
                      type="text"
                      bind:value={searchQuery}
                      placeholder="Search prospects..."
                      class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    </div>

                  <!-- Prospects Table -->
                  <div class="border rounded-lg overflow-hidden">
                    <table class="w-full">
                      <thead>
                        <tr class="bg-muted">
                          <th class="px-4 py-3 text-left">Name</th>
                          <th class="px-4 py-3 text-left">Title</th>
                          <th class="px-4 py-3 text-left">Email</th>
                          <th class="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each company.prospects.filter(p => 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                        ) as prospect}
                          <tr class="border-t hover:bg-muted/50">
                            <td class="px-4 py-3">
                      <button
                                class="hover:text-primary"
                                onclick={() => {
                                  selectedProspectForProfile = prospect;
                                  showProspectProfileModal = true;
                                }}
                              >
                                {prospect.name}
                      </button>
                            </td>
                            <td class="px-4 py-3 text-muted-foreground">{prospect.title}</td>
                            <td class="px-4 py-3">
                              {#if prospect.email}
                                <a href="mailto:{prospect.email}" class="text-primary hover:text-primary/80">
                                  {prospect.email}
                                </a>
          {:else}
                                <span class="text-muted-foreground">N/A</span>
          {/if}
                            </td>
                            <td class="px-4 py-3 text-right">
                              <div class="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onclick={() => handleProspectEdit(prospect)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onclick={() => handleProspectDelete(prospect)}
                                >
                                  Delete
                                </Button>
                </div>
                            </td>
                          </tr>
            {/each}
                      </tbody>
                    </table>
        </div>
                  </div>
          {:else}
                <p class="text-muted-foreground">No prospects added yet.</p>
          {/if}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annual-reports">
          <Card>
            <CardHeader>
              <CardTitle class="flex justify-between items-center">
                <span>Annual Reports</span>
                <Button onclick={() => showAnnualReportModal = true} variant="default">
                  Add Annual Report
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {#if company.annual_report && company.annual_report.length > 0}
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {#each company.annual_report as report}
                    <Card>
                      <CardContent class="pt-6">
                        <h3 class="font-semibold">Year {report.year}</h3>
                        <a 
                          href={report.url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-primary hover:text-primary/80"
                        >
                          View Report
                        </a>
                        <div class="flex gap-2 mt-4">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onclick={() => handleAnnualReportDelete(report)}
                          >
                            Delete
                          </Button>
                </div>
                      </CardContent>
                    </Card>
                  {/each}
              </div>
          {:else}
                <p class="text-muted-foreground">No annual reports added yet.</p>
          {/if}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cold-calling">
          <Card>
            <CardHeader>
              <CardTitle>Cold Calling Guides</CardTitle>
            </CardHeader>
            <CardContent>
              {#if company.prospects && company.prospects.length > 0}
                <div class="space-y-4">
                  <!-- Search input -->
                  <div class="relative">
            <input
              type="text"
                      bind:value={searchQuery}
                      placeholder="Search prospects..."
                      class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

                  <!-- Prospects Table -->
                  <div class="border rounded-lg overflow-hidden">
                    <table class="w-full">
                      <thead>
                        <tr class="bg-muted">
                          <th class="px-4 py-3 text-left">Name</th>
                          <th class="px-4 py-3 text-left">Title</th>
                          <th class="px-4 py-3 text-center">Guides</th>
                          <th class="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each company.prospects.filter(p => 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.title.toLowerCase().includes(searchQuery.toLowerCase())
                        ) as prospect}
                          <tr class="border-t hover:bg-muted/50">
                            <td class="px-4 py-3">{prospect.name}</td>
                            <td class="px-4 py-3 text-muted-foreground">{prospect.title}</td>
                            <td class="px-4 py-3 text-center">
                              <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                {getProspectGuidesCount(prospect.id)}
                              </span>
                            </td>
                            <td class="px-4 py-3 text-right">
                              <div class="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onclick={() => {
                                    selectedProspectForGuides = prospect;
                                    showColdCallingModal = true;
                                  }}
                                >
                                  View Guides
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onclick={() => {
                                    selectedProspect = prospect;
                                    handleGenerateColdCallingGuide();
                                  }}
                                  disabled={loading}
                                >
                                  {loading ? 'Generating...' : 'New Guide'}
                                </Button>
          </div>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
          </div>
          </div>
              {:else}
                <p class="text-muted-foreground">Add prospects first to generate cold calling guides.</p>
  {/if}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-drafts">
          <Card>
            <CardHeader>
              <CardTitle>Email Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              {#if company.prospects && company.prospects.length > 0}
        <div class="space-y-4">
                  <!-- Search input -->
                  <div class="relative">
            <input
              type="text"
                      bind:value={searchQuery}
                      placeholder="Search prospects..."
                      class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

                  <!-- Prospects Table -->
                  <div class="border rounded-lg overflow-hidden">
                    <table class="w-full">
                      <thead>
                        <tr class="bg-muted">
                          <th class="px-4 py-3 text-left">Name</th>
                          <th class="px-4 py-3 text-left">Title</th>
                          <th class="px-4 py-3 text-center">Email Drafts</th>
                          <th class="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each company.prospects.filter(p => 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.title.toLowerCase().includes(searchQuery.toLowerCase())
                        ) as prospect}
                          <tr class="border-t hover:bg-muted/50">
                            <td class="px-4 py-3">{prospect.name}</td>
                            <td class="px-4 py-3 text-muted-foreground">{prospect.title}</td>
                            <td class="px-4 py-3 text-center">
                              <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                {getProspectDraftsCount(prospect.id)}
                              </span>
                            </td>
                            <td class="px-4 py-3 text-right">
                              <div class="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onclick={() => {
                                    selectedProspectForDrafts = prospect;
                                    showEmailDraftsModal = true;
                                  }}
                                >
                                  View Drafts
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onclick={() => handleGenerateEmailDraft(prospect)}
                                  disabled={loading}
                                >
                                  {loading ? 'Generating...' : 'New Draft'}
                                </Button>
          </div>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
        </div>
      </div>
              {:else}
                <p class="text-muted-foreground">Add prospects first to generate email drafts.</p>
  {/if}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <!-- Modals -->
      <ResearchModal
        {show}
        {loading}
        {error}
        research={company.research_result?.[selectedResearchIndex || 0]}
        {editedContent}
        close={() => showResearchModal = false}
        save={handleResearchSave}
      />

      <EditProspectModal
        show={showProspectModal}
        {loading}
        {error}
        prospect={selectedProspect || undefined}
        close={() => {
          showProspectModal = false;
          selectedProspect = null;
        }}
        save={handleProspectSave}
      />

      {#if showEmailDraftsModal && selectedProspectForDrafts}
        <div
          class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
          transition:fade={{ duration: 200 }}
          onclick={() => showEmailDraftsModal = false}
          role="dialog"
          aria-modal="true"
        >
          <div
            class="bg-white p-6 rounded-lg w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-auto"
            onclick={e => e.stoppropagation()}
          >
            <div class="flex justify-between items-start mb-6">
              <div>
                <h2 class="text-2xl font-semibold">{selectedProspectForDrafts.name}</h2>
                <p class="text-muted-foreground">{selectedProspectForDrafts.title}</p>
                {#if selectedProspectForDrafts.email}
                  <a href="mailto:{selectedProspectForDrafts.email}" class="text-primary hover:text-primary/80">
                    {selectedProspectForDrafts.email}
                  </a>
                {/if}
              </div>
          <button
                class="text-muted-foreground hover:text-foreground"
                onclick={() => showEmailDraftsModal = false}
          >
            ×
          </button>
        </div>

        <div class="space-y-6">
              {#if company?.cold_email_drafts?.length && selectedProspectForDrafts}
                {#each company.cold_email_drafts.filter(d => d?.prospect?.id === selectedProspectForDrafts.id) as draft (draft.id)}
          <div class="border rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                      <p class="text-sm text-muted-foreground">
                        Generated: {new Date(draft.generated_at).toLocaleDateString()}
                      </p>
                      <div class="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onclick={() => handleEmailDraftDelete(draft.id)}
                        >
                          Delete
                        </Button>
                    </div>
                      </div>
                    <div class="mt-4 whitespace-pre-wrap prose dark:prose-invert">
                      {@html marked(draft.content)}
                      </div>
                    </div>
                {/each}
            {:else}
                <p class="text-muted-foreground">No email drafts generated yet.</p>
            {/if}
          </div>
                  </div>
                    </div>
            {/if}

      {#if showColdCallingModal && selectedProspectForGuides}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
          onclick={() => showColdCallingModal = false}
          role="dialog"
          aria-modal="true"
    >
      <div
            class="bg-white p-6 rounded-lg w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-auto"
        onclick={e => e.stoppropagation()}
      >
            <div class="flex justify-between items-start mb-6">
              <div>
                <h2 class="text-2xl font-semibold">{selectedProspectForGuides.name}</h2>
                <p class="text-muted-foreground">{selectedProspectForGuides.title}</p>
                {#if selectedProspectForGuides.email}
                  <a href="mailto:{selectedProspectForGuides.email}" class="text-primary hover:text-primary/80">
                    {selectedProspectForGuides.email}
                  </a>
        {/if}
                    </div>
              <button
                class="text-muted-foreground hover:text-foreground"
                onclick={() => showColdCallingModal = false}
              >
            ×
              </button>
          </div>

        <div class="space-y-6">
              {#if company?.cold_calling_guides?.length && selectedProspectForGuides}
                {#each company.cold_calling_guides.filter(d => d?.prospect?.id === selectedProspectForGuides.id) as guide (guide.id)}
          <div class="border rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                      <p class="text-sm text-muted-foreground">
                        Generated: {new Date(guide.generated_at).toLocaleDateString()}
                      </p>
                      <div class="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onclick={() => handleGuideDelete(guide.id)}
                        >
                          Delete
                        </Button>
          </div>
        </div>
                    <div class="mt-4 whitespace-pre-wrap prose dark:prose-invert">
                      {@html marked(guide.content)}
      </div>
    </div>
              {/each}
            {:else}
                <p class="text-muted-foreground">No cold calling guides generated yet.</p>
        {/if}
          </div>
      </div>
    </div>
  {/if}

        <!-- Add Prospect Profile Modal -->
        {#if showProspectProfileModal && selectedProspectForProfile}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
            onclick={() => showProspectProfileModal = false}
            role="dialog"
            aria-modal="true"
    >
      <div
              class="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-auto"
        onclick={e => e.stoppropagation()}
      >
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h2 class="text-2xl font-semibold">{selectedProspectForProfile.name}</h2>
                  <p class="text-muted-foreground">{selectedProspectForProfile.title}</p>
                </div>
          <button
                  class="text-muted-foreground hover:text-foreground"
                  onclick={() => showProspectProfileModal = false}
          >
            ×
          </button>
        </div>

              <div class="space-y-4">
                <div class="grid grid-cols-[120px,1fr] gap-2 items-center">
                  <span class="text-muted-foreground">Email:</span>
                  {#if selectedProspectForProfile.email}
                    <a href="mailto:{selectedProspectForProfile.email}" class="text-primary hover:text-primary/80">
                      {selectedProspectForProfile.email}
                    </a>
        {:else}
                    <span class="text-muted-foreground">N/A</span>
        {/if}
      </div>

                <div class="grid grid-cols-[120px,1fr] gap-2 items-center">
                  <span class="text-muted-foreground">Phone:</span>
                  {#if selectedProspectForProfile.phone}
                    <a href="tel:{selectedProspectForProfile.phone}" class="text-primary hover:text-primary/80">
                      {selectedProspectForProfile.phone}
                    </a>
                  {:else}
                    <span class="text-muted-foreground">N/A</span>
  {/if}
        </div>

                {#if selectedProspectForProfile.notes}
                  <div class="border-t pt-4 mt-4">
                    <h3 class="font-semibold mb-2">Notes</h3>
                    <p class="whitespace-pre-wrap">{selectedProspectForProfile.notes}</p>
                  </div>
            {/if}

                <div class="border-t pt-4 mt-4">
                  <h3 class="font-semibold mb-2">Activity</h3>
              <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span>Cold Calling Guides:</span>
                      <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {getProspectGuidesCount(selectedProspectForProfile.id)}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span>Email Drafts:</span>
                      <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {getProspectDraftsCount(selectedProspectForProfile.id)}
                      </span>
                      </div>
                    </div>
          </div>

                <div class="flex justify-end gap-2 border-t pt-4 mt-4">
                  <Button 
                    variant="outline"
                    onclick={() => {
                      showProspectProfileModal = false;
                      handleProspectEdit(selectedProspectForProfile);
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button 
                    variant="destructive"
                    onclick={() => {
                      if (confirm("Are you sure you want to delete this prospect?")) {
                        showProspectProfileModal = false;
                        handleProspectDelete(selectedProspectForProfile);
                      }
                    }}
                  >
                    Delete Profile
                  </Button>
                    </div>
                      </div>
                      </div>
                      </div>
            {/if}
    </div>
  {/if}
</div>
