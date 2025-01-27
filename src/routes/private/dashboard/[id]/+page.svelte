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

  interface TargetCompany {
    id: string;
    name: string;
    industry: string;
    website?: string;
    location?: string;
    size?: string;
    recentActivity?: Array<{
      type: 'note' | 'meeting' | 'transcript';
      title: string;
      date: string;
    }>;
    prospects?: Array<{
      id: string;
      name: string;
      title: string;
      email?: string;
      phone?: string;
      notes?: string;
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

  let { data } = $props();
  let { company, notes: initialNotes, opportunities: initialOpportunities } = $derived(data as {
    company: TargetCompany;
    notes: Note[];
    opportunities: Opportunity[];
  });

  let notes = $state<Note[]>(initialNotes);
  let opportunities = $state<Opportunity[]>(initialOpportunities);

  $effect(() => {
    notes = initialNotes;
  });

  $effect(() => {
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

  function formatDate(date: string) {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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
      
      const { error: updateError } = await data.supabase
        .from('targetcompanies')
        .update({
          cold_email_drafts: updatedDrafts
        })
        .eq('id', company.id);

      if (updateError) throw updateError;
      await invalidate('data');
    } catch (err) {
      console.error('Error deleting email draft:', err);
      alert('Failed to delete email draft. Please try again.');
    }
  }

  async function handleGuideDelete(guideId: string) {
    if (!confirm('Are you sure you want to delete this call guide?')) return;

    try {
      const updatedGuides = company.cold_calling_guides?.filter(g => g.id !== guideId) || [];
      
      const { error: updateError } = await data.supabase
        .from('targetcompanies')
        .update({
          cold_calling_guides: updatedGuides
        })
        .eq('id', company.id);

      if (updateError) throw updateError;
      await invalidate('data');
    } catch (err) {
      console.error('Error deleting call guide:', err);
      alert('Failed to delete call guide. Please try again.');
    }
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
              <p class="text-sm text-muted-foreground">No research data available</p>
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
              <p class="text-sm text-muted-foreground">No prospects added yet.</p>
              <Button 
                variant="outline" 
                class="mt-4"
                onclick={() => {
                  showProspectList = false;
                  selectedProspect = null;
                  showProspectModal = true;
                }}
              >
                Add Prospect
              </Button>
            </div>
          </div>
        {/if}
      </div>
    </DialogContent>
  </Dialog>

  <Dialog open={showEmailDrafts} onOpenChange={(open) => !open && (showEmailDrafts = false)}>
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
          <div class="p-4 bg-muted rounded-lg">
            <div class="text-center">
              <Mail class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p class="text-sm text-muted-foreground">No email drafts generated yet.</p>
              {#if company.prospects && company.prospects.length > 0}
                <p class="text-sm text-muted-foreground mt-2">
                  Select a prospect from the Prospects tab to generate an email draft.
                </p>
              {:else}
                <p class="text-sm text-muted-foreground mt-2">
                  Add prospects first to generate email drafts.
                </p>
              {/if}
            </div>
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
          <div class="p-4 bg-muted rounded-lg">
            <div class="text-center">
              <Phone class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p class="text-sm text-muted-foreground">No cold calling guides generated yet.</p>
              {#if company.prospects && company.prospects.length > 0}
                <p class="text-sm text-muted-foreground mt-2">
                  Select a prospect from the Prospects tab to generate a cold calling guide.
                </p>
              {:else}
                <p class="text-sm text-muted-foreground mt-2">
                  Add prospects first to generate cold calling guides.
                </p>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </DialogContent>
  </Dialog>
</div> 