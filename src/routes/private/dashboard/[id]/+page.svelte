<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Calendar, FileText, MessageSquare, Building2, Globe, MapPin, Users, Clock, Link, Trash2, Search, Table, Mail, Phone } from "lucide-svelte";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "$lib/components/ui/dialog";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Badge } from "$lib/components/ui/badge";
  import { invalidate } from "$app/navigation";
  import type { PageData } from "./$types";
  import * as Select from "$lib/components/ui/select";
  import { marked } from "marked";
  import ResearchList from "$lib/components/research/ResearchList.svelte";
  import ResearchModal from "$lib/components/research/ResearchModal.svelte";
  import { callProxy } from "$lib/services/apiService";
  import { ownCompany } from "$lib/stores/ownCompany";
  import { getPrompt } from "$lib/services/promptManager";

  interface TargetCompany {
    id: string;
    name: string;
    industry: string;
    website?: string;
    location?: string;
    size?: string;
    description?: string;
    research_result?: Array<{
      research_date: string;
      research_content: string;
      citations?: string[];
    }>;
    annual_report?: Array<{
      year: string;
      url: string;
    }>;
    prospects?: Array<{
      id: string;
      name: string;
      title: string;
      email?: string;
      phone?: string;
      notes?: string;
    }>;
    cold_calling_guides?: Array<{
      id: string;
      prospect: {
        id: string;
        name: string;
        title: string;
      };
      content: string;
      generated_at: string;
    }>;
    cold_email_drafts?: Array<{
      id: string;
      prospect: {
        id: string;
        name: string;
        title: string;
      };
      content: string;
      generated_at: string;
    }>;
  }

  interface Opportunity {
    id: string;
    name: string;
    target_customer_id: string;
    description: string;
    close_date?: string;
    stage: 'Prospecting' | 'Qualification' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Closing';
    type: 'New Business' | 'Upsell';
    probability: number;
    currency: 'USD' | 'EUR' | 'GBP';
    amount: number;
    next_step: string;
    created_at: string;
    updated_at: string;
  }

  interface Note {
    id: string;
    title: string;
    content: string;
    type: 'general' | 'meeting' | 'transcript';
    tags: string[];
    metadata: Record<string, any>;
    created_at: string;
    created_by: string;
  }

  interface Meeting {
    id: string;
    title: string;
    summary?: string;
    scheduled_for: string;
    location: string;
    attendees?: string[];
  }

  interface Transcript {
    id: string;
    title: string;
    summary?: string;
    duration?: string;
    date: string;
  }

  interface TargetCompanyResearch {
    research_date: string;
    research_content: string;
    citations?: string[];
  }

  type Prospect = {
    id: string;
    name: string;
    title: string;
    email?: string;
    phone?: string;
    notes?: string;
  };

  interface AIResponse {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
    citations?: string[];
  }

  type ModelProvider = import("$lib/services/apiService").ModelProvider;

  let { data } = $props();
  let { company: initialCompany, notes: initialNotes, opportunities: initialOpportunities } = $derived(data as {
    company: TargetCompany;
    notes: Note[];
    opportunities: Opportunity[];
  });

  let company = $state<TargetCompany>(initialCompany);
  let notes = $state<Note[]>(initialNotes);
  let opportunities = $state<Opportunity[]>(initialOpportunities);
  let error = $state<string | null>(null);

  $effect(() => {
    company = initialCompany;
    notes = initialNotes;
    opportunities = initialOpportunities;
  });

  let activeTag = $state<string | null>(null);
  let showAddNote = $state(false);
  let showAddOpportunity = $state(false);
  let showDeleteOpportunity = $state<{ id: string; name: string } | null>(null);
  let showDeleteNote = $state<{ id: string; title: string } | null>(null);
  let activeTab = $state('notes');

  // Modal states for quick actions
  let showCompanyResearch = $state(false);
  let showProspectList = $state(false);
  let showEmailDrafts = $state(false);
  let showCallGuides = $state(false);
  let latestResearch = $state<TargetCompanyResearch | null>(null);
  let showFullResearch = $state(false);

  // Note form state
  let noteTitle = $state("");
  let noteContent = $state("");
  let noteType = $state<'general' | 'meeting' | 'transcript'>('general');
  let noteTags = $state<string[]>([]);
  let noteMetadata = $state<Record<string, any>>({});

  // Opportunity form state
  let opportunityName = $state("");
  let opportunityDescription = $state("");
  let opportunityCloseDate = $state("");
  let opportunityStage = $state<Opportunity['stage']>('Prospecting');
  let opportunityType = $state<Opportunity['type']>('New Business');
  let opportunityProbability = $state(0);
  let opportunityCurrency = $state<Opportunity['currency']>('USD');
  let opportunityAmount = $state(0);
  let opportunityNextStep = $state("");

  // Add these new state variables
  let selectedProspect = $state<Prospect | null>(null);
  let showProspectModal = $state(false);

  // Add state variables for research functionality
  let researchLoading = $state(false);
  let showAnnualReportModal = $state(false);
  let selectedProspectForGuides = $state<Prospect | null>(null);

  // Add these new state variables
  let showResearchModal = $state(false);
  let researchResult = $state("");
  let selectedResearchIndex: number | null = $state(null);
  let editedContent = $state("");
  let show = $state(false);

  // Add this with the other state variables near the top of the script
  let loading = $state(false);

  // First, add a new tabs state variable for the research section
  let researchActiveTab = $state('research');

  // Update tabs array
  const tabs = [
    { id: 'notes', label: 'Notes' },
    { id: 'opportunities', label: 'Opportunities' }
  ] as const;

  // Add this with the other state variables
  let searchQuery = $state('');

  // Helper functions - place these after the state declarations and before the handlers
  function formatDate(date: string) {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function getProspectGuidesCount(prospectId: string): number {
    if (!company?.cold_calling_guides) return 0;
    return company.cold_calling_guides.filter(d => d?.prospect?.id === prospectId).length;
  }

  function getProspectDraftsCount(prospectId: string): number {
    if (!company?.cold_email_drafts) return 0;
    return company.cold_email_drafts.filter(d => d?.prospect?.id === prospectId).length;
  }

  function getSortedNotes() {
    if (!notes) return [];
    let filteredNotes = [...notes];
    if (activeTag) {
      filteredNotes = filteredNotes.filter(note => note.tags?.includes(activeTag as string));
    }
    return filteredNotes.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  function getSortedOpportunities() {
    if (!opportunities) return [];
    return [...opportunities].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  function getStageColor(stage: Opportunity['stage']) {
    const stageColors = {
      'Prospecting': 'bg-blue-100 text-blue-800',
      'Qualification': 'bg-purple-100 text-purple-800',
      'Discovery': 'bg-yellow-100 text-yellow-800',
      'Proposal': 'bg-orange-100 text-orange-800',
      'Negotiation': 'bg-pink-100 text-pink-800',
      'Closing': 'bg-green-100 text-green-800'
    };
    return stageColors[stage] || 'bg-gray-100 text-gray-800';
  }

  function formatCurrency(amount: number, currency: Opportunity['currency']) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  async function fetchLatestResearch() {
    const response = await fetch(`/api/companies/${company.id}/research`);
    if (response.ok) {
      const data = await response.json();
      latestResearch = data;
    }
  }

  $effect(() => {
    if (showCompanyResearch) {
      fetchLatestResearch();
    }
  });

  // Add these new functions
  async function handleProspectEdit(prospect: Prospect) {
    selectedProspect = prospect;
    showProspectModal = true;
  }

  async function handleProspectDelete(prospect: Prospect) {
    if (!confirm(`Are you sure you want to delete ${prospect.name}?`)) return;

    try {
      const updatedProspects = company.prospects?.filter(p => p.id !== prospect.id) || [];
      
      const { error: updateError } = await data.supabase
        .from('targetcompanies')
        .update({
          prospects: updatedProspects
        })
        .eq('id', company.id);

      if (updateError) throw updateError;
      await invalidate('data');
    } catch (err) {
      console.error('Error deleting prospect:', err);
      alert('Failed to delete prospect. Please try again.');
    }
  }

  async function handleEmailDraftDelete(draftId: string) {
    if (!confirm('Are you sure you want to delete this email draft?')) return;

    try {
      const updatedDrafts = company.cold_email_drafts?.filter(d => d.id !== draftId) || [];
      
      const { data: updatedCompanyData, error: updateError } = await data.supabase
        .from('targetcompanies')
        .update({
          cold_email_drafts: updatedDrafts
        })
        .eq('id', company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedCompanyData) {
        company = updatedCompanyData;
        await invalidate('data');
      }
    } catch (err) {
      error = handleError(err);
      console.error('Error deleting email draft:', err);
    }
  }

  async function handleGuideDelete(guideId: string) {
    if (!confirm('Are you sure you want to delete this call guide?')) return;

    try {
      const updatedGuides = company.cold_calling_guides?.filter(g => g.id !== guideId) || [];
      
      const { data: updatedCompanyData, error: updateError } = await data.supabase
        .from('targetcompanies')
        .update({
          cold_calling_guides: updatedGuides
        })
        .eq('id', company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedCompanyData) {
        company = updatedCompanyData;
        await invalidate('data');
      }
    } catch (err) {
      error = handleError(err);
      console.error('Error deleting call guide:', err);
    }
  }

  // Add functions for research functionality
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

      const { data: updatedCompany, error: updateError } = await data.supabase
        .from("targetcompanies")
        .update({
          research_result: updatedResearch,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
      researchResult = researchContent;
      editedContent = researchContent;
    } catch (err) {
      error = handleError(err);
      console.error("AI Research failed:", err);
    } finally {
      researchLoading = false;
    }
  }

  async function handleAnnualReportDelete(report: TargetCompany['annual_report'][0]) {
    if (!confirm("Are you sure you want to delete this annual report?")) return;

    try {
      const currentReports = company.annual_report || [];
      const updatedReports = currentReports.filter(r => r.year !== report.year);

      const { data: updatedCompanyData, error: updateError } = await data.supabase
        .from("targetcompanies")
        .update({
          annual_report: updatedReports,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedCompanyData) {
        company = updatedCompanyData;
        await invalidate('data');
      }
    } catch (err) {
      error = handleError(err);
    }
  }

  async function handleAnnualReportSave(report: TargetCompany['annual_report'][0]) {
    try {
      const currentReports = company.annual_report || [];
      
      // Check if a report for this year already exists
      if (currentReports.some(r => r.year === report.year)) {
        error = `A report for year ${report.year} already exists`;
        return;
      }

      const updatedReports = [...currentReports, report];

      const { data: updatedCompanyData, error: updateError } = await data.supabase
        .from("targetcompanies")
        .update({
          annual_report: updatedReports,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedCompanyData) {
        company = updatedCompanyData;
        showAnnualReportModal = false;
        await invalidate('data');
      }
    } catch (err) {
      error = handleError(err);
    }
  }

  async function handleProspectSave(prospect: Omit<Prospect, 'id'>) {
    try {
      loading = true;
      error = null;
      const currentProspects = company.prospects || [];
      let updatedProspects;

      if (selectedProspect) {
        updatedProspects = currentProspects.map(p => 
          p.id === selectedProspect.id ? { ...prospect, id: selectedProspect.id } : p
        );
      } else {
        updatedProspects = [...currentProspects, { ...prospect, id: crypto.randomUUID() }];
      }

      const { data: updatedCompanyData, error: updateError } = await data.supabase
        .from("targetcompanies")
        .update({
          prospects: updatedProspects,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedCompanyData) {
        company = updatedCompanyData;
        showProspectModal = false;
        selectedProspect = null;
        await invalidate('data');
      }
    } catch (err) {
      error = handleError(err);
      console.error("Error saving prospect:", err);
    } finally {
      loading = false;
    }
  }

  function handleError(err: any): string {
    console.error(err);
    return err.message || 'An unexpected error occurred';
  }

  // Add research handlers
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

      const { data: updatedCompany, error: updateError } = await data.supabase
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

      const { data: updatedCompany, error: updateError } = await data.supabase
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

  $effect(() => {
    show = showResearchModal;
  });

  // Add these functions to handle the generation
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

      const { prompt, model, provider } = getPrompt("prospecting_email", promptVariables);
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

      const { data: updatedCompany, error: updateError } = await data.supabase
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

  async function handleGenerateEmailDraft(prospect: Prospect) {
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

      const { prompt, model, provider } = getPrompt("prospecting_email", promptVariables);
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

      const { data: updatedCompany, error: updateError } = await data.supabase
        .from("targetcompanies")
        .update({
          cold_email_drafts: [...(company.cold_email_drafts || []), draft],
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedCompany) {
        company = updatedCompany;
      }
    } catch (err) {
      error = "Failed to generate email draft. Please try again.";
      console.error("Email draft generation failed:", err);
    } finally {
      loading = false;
    }
  }

  // Add these helper functions near the other utility functions
  function getAllTags() {
    const tagSet = new Set<string>();
    if (!notes) return [];
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }

  async function handleAddNote(event: SubmitEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const newNote = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      type: noteType,
      tags: noteTags || [],
      metadata: noteMetadata || {},
      target_company_id: company.id,
      created_at: new Date().toISOString(),
      created_by: 'current_user'
    };

    const response = await fetch(`/api/companies/${company.id}/notes`, {
      method: 'POST',
      body: JSON.stringify(newNote),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const savedNote = await response.json();
      // Ensure the note has all required fields before adding to local state
      const completeNote: Note = {
        id: savedNote.id,
        title: savedNote.title,
        content: savedNote.content,
        type: savedNote.type,
        tags: savedNote.tags || [],
        metadata: savedNote.metadata || {},
        created_at: savedNote.created_at,
        created_by: savedNote.created_by
      };
      notes = [completeNote, ...notes];
      showAddNote = false;
      // Reset form
      noteTitle = "";
      noteContent = "";
      noteType = 'general';
      noteTags = [];
      noteMetadata = {};
      await invalidate('data');
    }
  }

  async function handleDeleteNote(noteId: string) {
    const response = await fetch(`/api/companies/${company.id}/notes?noteId=${noteId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      notes = notes.filter(note => note.id !== noteId);
      await invalidate('data');
    }
  }

  // Opportunity Management Functions
  async function handleAddOpportunity(event: SubmitEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const newOpportunity = {
      name: opportunityName,
      target_customer_id: company.id,
      description: opportunityDescription,
      close_date: opportunityCloseDate || null,
      stage: opportunityStage,
      type: opportunityType,
      probability: opportunityProbability,
      currency: opportunityCurrency,
      amount: opportunityAmount,
      next_step: opportunityNextStep || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const response = await fetch(`/api/companies/${company.id}/opportunities`, {
      method: 'POST',
      body: JSON.stringify(newOpportunity),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const savedOpportunity = await response.json();
      opportunities = [savedOpportunity, ...opportunities];
      showAddOpportunity = false;
      // Reset form
      opportunityName = "";
      opportunityDescription = "";
      opportunityCloseDate = "";
      opportunityStage = 'Prospecting';
      opportunityType = 'New Business';
      opportunityProbability = 0;
      opportunityCurrency = 'USD';
      opportunityAmount = 0;
      opportunityNextStep = "";
      await invalidate('data');
    }
  }

  async function handleDeleteOpportunity(opportunityId: string) {
    if (!opportunityId) return;
    
    const response = await fetch(`/api/companies/${company.id}/opportunities?opportunityId=${opportunityId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      opportunities = opportunities.filter(opp => opp.id !== opportunityId);
      await invalidate('data');
    }
  }

  // Add these missing state variables
  let showColdCallingModal = $state(false);
  let showEmailDraftsModal = $state(false);
  let selectedEmailResearch = $state<ResearchResult | null>(null);
  let selectedEmailReport = $state<string | null>(null);
  let selectedEmailGuide = $state<ColdCallingGuide | null>(null);

  let coldCallingSearchQuery = $state('');
  let emailDraftsSearchQuery = $state('');

  function closeColdCallingModal() {
    showColdCallingModal = false;
    selectedProspectForGuides = null;
  }

  function closeEmailDraftsModal() {
    showEmailDraftsModal = false;
    selectedProspectForDrafts = null;
  }
</script>

<div class="container mx-auto p-6 max-w-7xl">
  <!-- Header Section -->
  <div class="mb-8">
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-4xl font-bold">{company.name}</h1>
        <div class="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{company.industry}</Badge>
          {#if company.size}
            <Badge variant="outline">{company.size} employees</Badge>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left Sidebar -->
    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Building2 class="w-5 h-5" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl class="space-y-4">
            {#if company.website}
              <div class="flex items-center gap-2">
                <Globe class="w-4 h-4 text-muted-foreground" />
                <dt class="sr-only">Website</dt>
                <dd class="flex items-center gap-2">
                  <a href={company.website} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">{company.website}</a>
                  <Link class="w-3 h-3" />
                </dd>
              </div>
            {/if}
            {#if company.location}
              <div class="flex items-center gap-2">
                <MapPin class="w-4 h-4 text-muted-foreground" />
                <dt class="sr-only">Location</dt>
                <dd>{company.location}</dd>
              </div>
            {/if}
            {#if company.size}
              <div class="flex items-center gap-2">
                <Users class="w-4 h-4 text-muted-foreground" />
                <dt class="sr-only">Size</dt>
                <dd>{company.size} employees</dd>
              </div>
            {/if}
          </dl>

          <div class="border-t mt-4 pt-4">
            <div class="text-sm font-medium mb-2">Quick Actions</div>
            <div class="grid grid-cols-2 gap-2">
              <Button 
                variant="ghost" 
                class="flex items-center justify-start gap-2 h-auto py-2 px-2 hover:bg-muted"
                onclick={() => showCompanyResearch = true}
              >
                <Search class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm">Company Research</span>
              </Button>
              <Button 
                variant="ghost" 
                class="flex items-center justify-start gap-2 h-auto py-2 px-2 hover:bg-muted"
                onclick={() => showProspectList = true}
              >
                <Table class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm">Prospect List</span>
              </Button>
              <Button 
                variant="ghost" 
                class="flex items-center justify-start gap-2 h-auto py-2 px-2 hover:bg-muted"
                onclick={() => showEmailDrafts = true}
              >
                <Mail class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm">Email Drafts</span>
              </Button>
              <Button 
                variant="ghost" 
                class="flex items-center justify-start gap-2 h-auto py-2 px-2 hover:bg-muted"
                onclick={() => showCallGuides = true}
              >
                <Phone class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm">Call Guides</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content Area -->
    <div class="lg:col-span-2">
      <Tabs value={activeTab} onValueChange={(value) => activeTab = value}>
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div class="flex justify-between items-center">
                <div>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>All notes related to {company.name}</CardDescription>
                </div>
                <Button onclick={() => showAddNote = true}>
                  <Plus class="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
              <div class="flex gap-2 mt-4 flex-wrap">
                <Button 
                  variant={activeTag === null ? "secondary" : "outline"}
                  onclick={() => activeTag = null}
                  size="sm"
                >
                  All
                </Button>
                {#each getAllTags() as tag}
                  <Button 
                    variant={activeTag === tag ? "secondary" : "outline"}
                    onclick={() => activeTag = tag}
                    size="sm"
                  >
                    {tag}
                  </Button>
                {/each}
              </div>
            </CardHeader>
            <CardContent>
              <div class="space-y-6">
                {#each getSortedNotes() as note}
                  <div class="border-l-2 border-primary pl-4 py-2">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="font-medium">{note.title}</h4>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            class="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onclick={() => showDeleteNote = { id: note.id, title: note.title }}
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        </div>
                        <div class="flex gap-2 mt-1">
                          <Badge variant="secondary">{note.type}</Badge>
                          {#each note.tags as tag}
                            <Badge variant="outline">{tag}</Badge>
                          {/each}
                        </div>
                      </div>
                      <span class="text-sm text-muted-foreground">{formatDate(note.created_at)}</span>
                    </div>
                    <p class="text-muted-foreground whitespace-pre-line">{note.content}</p>
                    {#if note.type === 'meeting' && note.metadata.attendees}
                      <div class="mt-2 text-sm text-muted-foreground">
                        <strong>Attendees:</strong> {note.metadata.attendees.join(', ')}
                      </div>
                    {/if}
                  </div>
                {:else}
                  <div class="text-center py-8">
                    <MessageSquare class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p class="text-muted-foreground">No notes yet. Click "Add Note" to create one.</p>
                  </div>
                {/each}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <div class="flex justify-between items-center">
                <div>
                  <CardTitle>Opportunities</CardTitle>
                  <CardDescription>Sales opportunities with {company.name}</CardDescription>
                </div>
                <Button onclick={() => showAddOpportunity = true}>
                  <Plus class="w-4 h-4 mr-2" />
                  Add Opportunity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div class="space-y-6">
                {#each getSortedOpportunities() as opportunity}
                  <div class="border rounded-lg p-4">
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="text-lg font-medium">{opportunity.name}</h4>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            class="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onclick={() => showDeleteOpportunity = { id: opportunity.id, name: opportunity.name }}
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        </div>
                        <div class="flex gap-2 mt-2">
                          <Badge class={getStageColor(opportunity.stage)}>{opportunity.stage}</Badge>
                          <Badge variant="outline">{opportunity.type}</Badge>
                          <Badge variant="outline">{opportunity.probability}% Probability</Badge>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-semibold">{formatCurrency(opportunity.amount, opportunity.currency)}</div>
                        {#if opportunity.close_date}
                          <div class="text-sm text-muted-foreground">Close Date: {new Date(opportunity.close_date).toLocaleDateString()}</div>
                        {/if}
                      </div>
                    </div>
                    <div class="space-y-2">
                      <p class="text-muted-foreground">{opportunity.description}</p>
                      {#if opportunity.next_step}
                        <div class="mt-4">
                          <strong class="text-sm">Next Step:</strong>
                          <p class="text-sm text-muted-foreground">{opportunity.next_step}</p>
                        </div>
                      {/if}
                    </div>
                  </div>
                {:else}
                  <div class="text-center py-8">
                    <MessageSquare class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p class="text-muted-foreground">No opportunities yet. Click "Add Opportunity" to create one.</p>
                  </div>
                {/each}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>

  <!-- Research and Related Sections -->
  <div class="mt-8">
    <Card>
      <CardHeader>
        <CardTitle>Research & Intelligence</CardTitle>
        <CardDescription>
          Research, insights, and intelligence about {company.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={researchActiveTab} onValueChange={(value) => researchActiveTab = value}>
          <TabsList>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="prospects">Prospects</TabsTrigger>
            <TabsTrigger value="annual-reports">Annual Reports</TabsTrigger>
            <TabsTrigger value="cold-calling">Cold Calling Guide</TabsTrigger>
            <TabsTrigger value="email-drafts">Email Drafts</TabsTrigger>
          </TabsList>

          <TabsContent value="research">
            <div class="space-y-4">
              <div class="flex justify-end">
                <Button onclick={handleAIResearch} disabled={researchLoading}>
                  {#if researchLoading}
                    <div class="animate-spin rounded-full h-4 w-4 border-2 border-muted border-t-foreground mr-2"></div>
                  {/if}
                  {researchLoading ? 'Researching...' : 'Do AI Research'}
                </Button>
              </div>

              {#if company.research_result && company.research_result.length > 0}
                <div class="space-y-4">
                  {#each company.research_result as research, index}
                    <div class="p-4 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors">
                      <div class="flex justify-between items-start mb-2">
                        <h3 class="font-medium">Research #{index + 1}</h3>
                        <span class="text-sm text-muted-foreground">
                          {research.research_date ? formatDate(research.research_date) : 'Date not available'}
                        </span>
                      </div>
                      <div class="prose prose-sm max-w-none">
                        {@html marked(research.research_content.slice(0, 200) + '...')}
                      </div>
                      <div class="flex justify-end gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onclick={() => handleResearchView({ detail: { research, index } })}
                        >
                          View Full Research
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onclick={() => handleResearchDelete({ detail: { index } })}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8">
                  <Search class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p class="text-muted-foreground">No research data available</p>
                </div>
              {/if}
            </div>
          </TabsContent>

          <TabsContent value="prospects">
            <div class="space-y-4">
              <div class="flex justify-end">
                <Button onclick={() => showProspectModal = true}>
                  <Plus class="w-4 h-4 mr-2" />
                  Add Prospect
                </Button>
              </div>

              {#if company.prospects && company.prospects.length > 0}
                <div class="border rounded-lg overflow-hidden">
                  <table class="w-full">
                    <thead>
                      <tr class="bg-muted">
                        <th class="px-4 py-3 text-left">Name</th>
                        <th class="px-4 py-3 text-left">Title</th>
                        <th class="px-4 py-3 text-left">Email</th>
                        <th class="px-4 py-3 text-left">Phone</th>
                        <th class="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each company.prospects as prospect}
                        <tr class="border-t hover:bg-muted/50">
                          <td class="px-4 py-3">{prospect.name}</td>
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
                          <td class="px-4 py-3">
                            {#if prospect.phone}
                              <a href="tel:{prospect.phone}" class="text-primary hover:text-primary/80">
                                {prospect.phone}
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
              {:else}
                <div class="text-center py-8">
                  <Users class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p class="text-muted-foreground">No prospects added yet</p>
                </div>
              {/if}
            </div>
          </TabsContent>

          <TabsContent value="annual-reports">
            <div class="space-y-4">
              <div class="flex justify-end">
                <Button onclick={() => showAnnualReportModal = true}>
                  <Plus class="w-4 h-4 mr-2" />
                  Add Annual Report
                </Button>
              </div>

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
                <div class="text-center py-8">
                  <FileText class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p class="text-muted-foreground">No annual reports added yet</p>
                </div>
              {/if}
            </div>
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
                        bind:value={coldCallingSearchQuery}
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
                            p.name.toLowerCase().includes(coldCallingSearchQuery.toLowerCase()) ||
                            p.title.toLowerCase().includes(coldCallingSearchQuery.toLowerCase())
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
                  <div class="text-center py-8">
                    <Phone class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p class="text-muted-foreground">Add prospects first to generate cold calling guides</p>
                    <Button 
                      variant="outline" 
                      class="mt-4"
                      onclick={() => {
                        researchActiveTab = 'prospects';
                      }}
                    >
                      Add Prospects
                    </Button>
                  </div>
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
                        bind:value={emailDraftsSearchQuery}
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
                            p.name.toLowerCase().includes(emailDraftsSearchQuery.toLowerCase()) ||
                            p.title.toLowerCase().includes(emailDraftsSearchQuery.toLowerCase())
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
                  <div class="text-center py-8">
                    <Mail class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p class="text-muted-foreground">Add prospects first to generate email drafts</p>
                    <Button 
                      variant="outline" 
                      class="mt-4"
                      onclick={() => {
                        researchActiveTab = 'prospects';
                      }}
                    >
                      Add Prospects
                    </Button>
                  </div>
                {/if}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>

  <!-- Dialogs -->
  <Dialog bind:open={showAddNote}>
    <DialogContent>
      <form onsubmit={handleAddNote}>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Add a note about {company.name}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="title">Title</Label>
            <Input id="title" name="title" bind:value={noteTitle} required />
          </div>
          <div class="grid gap-2">
            <Label for="type">Type</Label>
            <Select.Root type="single" value={noteType} onValueChange={(value) => noteType = value as 'general' | 'meeting' | 'transcript'}>
              <Select.Trigger class="w-full">
                <span class="capitalize">{noteType}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  <Select.Item value="general">
                    <span class="capitalize">General</span>
                  </Select.Item>
                  <Select.Item value="meeting">
                    <span class="capitalize">Meeting</span>
                  </Select.Item>
                  <Select.Item value="transcript">
                    <span class="capitalize">Transcript</span>
                  </Select.Item>
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-2">
            <Label for="tags">Tags (comma-separated)</Label>
            <Input 
              id="tags" 
              name="tags" 
              placeholder="Enter tags..."
              onchange={(e) => {
                noteTags = e.currentTarget.value
                  .split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length > 0);
              }}
            />
          </div>
          {#if noteType === 'meeting'}
            <div class="grid gap-2">
              <Label for="attendees">Attendees (comma-separated)</Label>
              <Input 
                id="attendees" 
                name="attendees" 
                placeholder="Enter attendees..."
                onchange={(e) => {
                  noteMetadata = {
                    ...noteMetadata,
                    attendees: e.currentTarget.value
                      .split(',')
                      .map(attendee => attendee.trim())
                      .filter(attendee => attendee.length > 0)
                  };
                }}
              />
            </div>
          {/if}
          <div class="grid gap-2">
            <Label for="content">Content</Label>
            <Textarea id="content" name="content" bind:value={noteContent} required rows={5} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onclick={() => showAddNote = false}>
            Cancel
          </Button>
          <Button type="submit">Save Note</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <Dialog bind:open={showAddOpportunity}>
    <DialogContent>
      <form onsubmit={handleAddOpportunity}>
        <DialogHeader>
          <DialogTitle>Add Opportunity</DialogTitle>
          <DialogDescription>
            Create a new sales opportunity with {company.name}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="opportunityName">Opportunity Name</Label>
            <Input id="opportunityName" bind:value={opportunityName} required />
          </div>
          <div class="grid gap-2">
            <Label for="opportunityDescription">Description</Label>
            <Textarea id="opportunityDescription" bind:value={opportunityDescription} required rows={3} />
          </div>
          <div class="grid gap-2">
            <Label for="opportunityCloseDate">Close Date</Label>
            <Input type="date" id="opportunityCloseDate" bind:value={opportunityCloseDate} />
          </div>
          <div class="grid gap-2">
            <Label for="opportunityStage">Stage</Label>
            <Select.Root type="single" value={opportunityStage} onValueChange={(value) => opportunityStage = value as Opportunity['stage']}>
              <Select.Trigger class="w-full">
                <span class="capitalize">{opportunityStage}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  {#each ['Prospecting', 'Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closing'] as stage}
                    <Select.Item value={stage}>
                      <span class="capitalize">{stage}</span>
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-2">
            <Label for="opportunityType">Type</Label>
            <Select.Root type="single" value={opportunityType} onValueChange={(value) => opportunityType = value as Opportunity['type']}>
              <Select.Trigger class="w-full">
                <span class="capitalize">{opportunityType}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  <Select.Item value="New Business">
                    <span class="capitalize">New Business</span>
                  </Select.Item>
                  <Select.Item value="Upsell">
                    <span class="capitalize">Upsell</span>
                  </Select.Item>
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-2">
            <Label for="opportunityProbability">Probability (%)</Label>
            <Input 
              type="number" 
              id="opportunityProbability" 
              bind:value={opportunityProbability} 
              min="0" 
              max="100" 
              required 
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="opportunityCurrency">Currency</Label>
              <Select.Root type="single" value={opportunityCurrency} onValueChange={(value) => opportunityCurrency = value as Opportunity['currency']}>
                <Select.Trigger class="w-full">
                  <span class="capitalize">{opportunityCurrency}</span>
                </Select.Trigger>
                <Select.Content>
                  <Select.Group>
                    {#each ['USD', 'EUR', 'GBP'] as currency}
                      <Select.Item value={currency}>
                        <span class="capitalize">{currency}</span>
                      </Select.Item>
                    {/each}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            </div>
            <div class="grid gap-2">
              <Label for="opportunityAmount">Amount</Label>
              <Input 
                type="number" 
                id="opportunityAmount" 
                bind:value={opportunityAmount} 
                min="0" 
                step="0.01" 
                required 
              />
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="opportunityNextStep">Next Step</Label>
            <Textarea id="opportunityNextStep" bind:value={opportunityNextStep} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onclick={() => showAddOpportunity = false}>
            Cancel
          </Button>
          <Button type="submit">Save Opportunity</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <Dialog open={!!showDeleteOpportunity} onOpenChange={(open) => !open && (showDeleteOpportunity = null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Opportunity</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete the opportunity "{showDeleteOpportunity?.name}"?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onclick={() => showDeleteOpportunity = null}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onclick={() => {
          handleDeleteOpportunity(showDeleteOpportunity?.id || '');
          showDeleteOpportunity = null;
        }}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog open={!!showDeleteNote} onOpenChange={(open) => !open && (showDeleteNote = null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Note</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete the note "{showDeleteNote?.title}"?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onclick={() => showDeleteNote = null}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onclick={() => {
          handleDeleteNote(showDeleteNote?.id || '');
          showDeleteNote = null;
        }}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Quick Action Modals -->
  <Dialog open={showCompanyResearch} onOpenChange={(open) => !open && (showCompanyResearch = false)}>
    <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Company Research</DialogTitle>
        <DialogDescription>
          Latest research and insights about {company.name}
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        {#if latestResearch}
          <div class="p-4 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors" onclick={() => showFullResearch = true}>
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-medium">Latest Research</h3>
              <span class="text-sm text-muted-foreground">
                {latestResearch.research_date ? formatDate(latestResearch.research_date) : 'Date not available'}
              </span>
            </div>
            <div class="prose prose-sm max-w-none">
              {@html marked(latestResearch.research_content.split('\n\nCitations:')[0])}
              <span class="text-sm text-primary mt-2 block">Click to view full research</span>
            </div>
          </div>
        {:else}
          <div class="p-4 bg-muted rounded-lg">
            <div class="text-center">
              <Search class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p class="text-muted-foreground">No research data available</p>
            </div>
          </div>
        {/if}
      </div>
    </DialogContent>
  </Dialog>

  <!-- Full Research Modal -->
  <Dialog open={showFullResearch} onOpenChange={(open) => !open && (showFullResearch = false)}>
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Full Research Report</DialogTitle>
        <DialogDescription>
          Detailed research for {company.name}
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        {#if latestResearch}
          <div class="text-sm text-muted-foreground mb-4">
            Generated on: {latestResearch.research_date ? formatDate(latestResearch.research_date) : 'Date not available'}
          </div>
          <div class="prose prose-sm max-w-none">
            {#if latestResearch.research_content}
              {@html marked(latestResearch.research_content.split('\n\nCitations:')[0].replace(/\[(\d+)\]/g, (_, num) => {
                if (!latestResearch?.citations?.length) return `[${num}]`;
                const citation = latestResearch.citations[parseInt(num) - 1];
                if (!citation) return `[${num}]`;
                // Extract URL from citation if it exists
                const urlMatch = citation.match(/https?:\/\/[^\s)]+/);
                const url = urlMatch ? urlMatch[0] : null;
                return url ? 
                  `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary/80">[${num}]</a>` :
                  `[${num}]`;
              }))}
            {/if}
            
            {#if latestResearch.citations?.length}
              <div class="mt-8 pt-4 border-t">
                <h3 class="text-lg font-semibold mb-4">Citations</h3>
                <ol class="list-decimal list-inside space-y-2">
                  {#each latestResearch.citations as citation, i}
                    <li class="text-sm text-muted-foreground">
                      {@html citation.replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary/80">$1</a>')}
                    </li>
                  {/each}
                </ol>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </DialogContent>
  </Dialog>

  <Dialog open={showProspectList} onOpenChange={(open) => !open && (showProspectList = false)}>
    <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Prospect List</DialogTitle>
        <DialogDescription>
          Key contacts and prospects at {company.name}
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        {#if company.prospects && company.prospects.length > 0}
          <div class="border rounded-lg overflow-hidden">
            <table class="w-full">
              <thead>
                <tr class="bg-muted">
                  <th class="px-4 py-3 text-left">Name</th>
                  <th class="px-4 py-3 text-left">Title</th>
                  <th class="px-4 py-3 text-left">Email</th>
                  <th class="px-4 py-3 text-left">Phone</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each company.prospects as prospect}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-4 py-3">{prospect.name}</td>
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
                    <td class="px-4 py-3">
                      {#if prospect.phone}
                        <a href="tel:{prospect.phone}" class="text-primary hover:text-primary/80">
                          {prospect.phone}
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
        {:else}
          <div class="p-4 bg-muted rounded-lg">
            <div class="text-center">
              <Users class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p class="text-sm text-muted-foreground">No prospects added yet</p>
            </div>
          </div>
        {/if}
      </div>
    </DialogContent>
  </Dialog>

  <Dialog open={showEmailDrafts} onOpenChange={(open) => !open && closeEmailDraftsModal()}>
    <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Email Drafts</DialogTitle>
        <DialogDescription>
          Email templates and drafts for {company.name}
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        {#if company.cold_email_drafts && company.cold_email_drafts.length > 0}
          {#each company.cold_email_drafts as draft}
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h4 class="font-medium">For: {draft.prospect.name}</h4>
                  <p class="text-sm text-muted-foreground">{draft.prospect.title}</p>
                </div>
                <div class="text-sm text-muted-foreground">
                  Generated: {formatDate(draft.generated_at)}
                </div>
              </div>
              <div class="prose prose-sm max-w-none">
                {@html marked(draft.content)}
              </div>
              <div class="flex justify-end mt-4">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onclick={() => handleEmailDraftDelete(draft.id)}
                >
                  Delete Draft
                </Button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="text-center py-8">
            <Mail class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">No email drafts generated yet</p>
          </div>
        {/if}
      </div>
    </DialogContent>
  </Dialog>

  <Dialog open={showCallGuides} onOpenChange={(open) => !open && (showCallGuides = false)}>
    <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Call Guides</DialogTitle>
        <DialogDescription>
          Cold calling scripts and guides for {company.name}
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        {#if company.cold_calling_guides && company.cold_calling_guides.length > 0}
          {#each company.cold_calling_guides as guide}
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h4 class="font-medium">For: {guide.prospect.name}</h4>
                  <p class="text-sm text-muted-foreground">{guide.prospect.title}</p>
                </div>
                <div class="text-sm text-muted-foreground">
                  Generated: {formatDate(guide.generated_at)}
                </div>
              </div>
              <div class="prose prose-sm max-w-none">
                {@html marked(guide.content)}
              </div>
              <div class="flex justify-end mt-4">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onclick={() => handleGuideDelete(guide.id)}
                >
                  Delete Guide
                </Button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="text-center py-8">
            <Phone class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">No cold calling guides generated yet</p>
          </div>
        {/if}
      </div>
    </DialogContent>
  </Dialog>

  <!-- Prospect Modal -->
  <Dialog bind:open={showProspectModal}>
    <DialogContent>
      <form onsubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const prospect = {
          name: formData.get('name') as string,
          title: formData.get('title') as string,
          email: formData.get('email') as string || undefined,
          phone: formData.get('phone') as string || undefined,
          notes: formData.get('notes') as string || undefined
        };
        handleProspectSave(prospect);
      }}>
        <DialogHeader>
          <DialogTitle>{selectedProspect ? 'Edit' : 'Add'} Prospect</DialogTitle>
          <DialogDescription>
            {selectedProspect ? 'Edit prospect details' : 'Add a new prospect to'} {company.name}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="name">Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={selectedProspect?.name || ''} 
              required 
            />
          </div>
          <div class="grid gap-2">
            <Label for="title">Title</Label>
            <Input 
              id="title" 
              name="title" 
              value={selectedProspect?.title || ''} 
              required 
            />
          </div>
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={selectedProspect?.email || ''} 
            />
          </div>
          <div class="grid gap-2">
            <Label for="phone">Phone</Label>
            <Input 
              id="phone" 
              name="phone" 
              type="tel" 
              value={selectedProspect?.phone || ''} 
            />
          </div>
          <div class="grid gap-2">
            <Label for="notes">Notes</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              value={selectedProspect?.notes || ''} 
              rows={3} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onclick={() => showProspectModal = false}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <!-- Annual Report Modal -->
  <Dialog bind:open={showAnnualReportModal}>
    <DialogContent>
      <form onsubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const report = {
          year: formData.get('year') as string,
          url: formData.get('url') as string
        };
        handleAnnualReportSave(report);
      }}>
        <DialogHeader>
          <DialogTitle>Add Annual Report</DialogTitle>
          <DialogDescription>
            Add a new annual report for {company.name}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="year">Year</Label>
            <Input 
              id="year" 
              name="year" 
              type="number" 
              min="1900" 
              max={new Date().getFullYear()} 
              required 
            />
          </div>
          <div class="grid gap-2">
            <Label for="url">URL</Label>
            <Input 
              id="url" 
              name="url" 
              type="url" 
              placeholder="https://" 
              required 
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onclick={() => showAnnualReportModal = false}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <!-- Research Modal -->
  <ResearchModal
    {show}
    {loading}
    {error}
    research={company.research_result?.[selectedResearchIndex || 0]}
    {editedContent}
    close={() => showResearchModal = false}
    save={handleResearchSave}
  />

  <!-- Add this near the other modals at the bottom of the file -->

  <!-- Cold Calling Guides Modal -->
  {#if showColdCallingModal && selectedProspectForGuides}
    <Dialog open={showColdCallingModal} onOpenChange={(open) => !open && closeColdCallingModal()}>
      <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cold Calling Guides - {selectedProspectForGuides.name}</DialogTitle>
          <DialogDescription>
            {selectedProspectForGuides.title}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          {#if company.cold_calling_guides?.filter(g => g.prospect.id === selectedProspectForGuides.id).length > 0}
            {#each company.cold_calling_guides.filter(g => g.prospect.id === selectedProspectForGuides.id) as guide}
              <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-sm text-muted-foreground">
                    Generated: {formatDate(guide.generated_at)}
                  </span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onclick={() => handleGuideDelete(guide.id)}
                  >
                    Delete
                  </Button>
                </div>
                <div class="prose prose-sm max-w-none mt-4">
                  {@html marked(guide.content)}
                </div>
              </div>
            {/each}
          {:else}
            <div class="text-center py-8">
              <Phone class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p class="text-muted-foreground">No cold calling guides generated for this prospect yet</p>
            </div>
          {/if}
        </div>
      </DialogContent>
    </Dialog>
  {/if}

  <!-- Email Drafts Modal -->
  {#if showEmailDraftsModal && selectedProspectForDrafts}
    <Dialog open={showEmailDraftsModal} onOpenChange={(open) => !open && closeEmailDraftsModal()}>
      <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Drafts - {selectedProspectForDrafts.name}</DialogTitle>
          <DialogDescription>
            {selectedProspectForDrafts.title}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          {#if company.cold_email_drafts?.filter(d => d.prospect.id === selectedProspectForDrafts.id).length > 0}
            {#each company.cold_email_drafts.filter(d => d.prospect.id === selectedProspectForDrafts.id) as draft}
              <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-sm text-muted-foreground">
                    Generated: {formatDate(draft.generated_at)}
                  </span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onclick={() => handleEmailDraftDelete(draft.id)}
                  >
                    Delete
                  </Button>
                </div>
                <div class="prose prose-sm max-w-none mt-4">
                  {@html marked(draft.content)}
                </div>
              </div>
            {/each}
          {:else}
            <div class="text-center py-8">
              <Mail class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p class="text-muted-foreground">No email drafts generated for this prospect yet</p>
            </div>
          {/if}
        </div>
      </DialogContent>
    </Dialog>
  {/if}
</div> 