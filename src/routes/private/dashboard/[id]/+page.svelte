<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Calendar, FileText, MessageSquare, Building2, Globe, MapPin, Users, Clock, Link, Trash2 } from "lucide-svelte";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "$lib/components/ui/dialog";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Badge } from "$lib/components/ui/badge";
  import { invalidate } from "$app/navigation";
  import type { PageData } from "./$types";
  import * as Select from "$lib/components/ui/select";

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

  let { data } = $props();
  let { company, notes } = $derived(data as {
    company: TargetCompany;
    notes: Note[];
  });

  let activeTag = $state<string | null>(null);
  let showAddNote = $state(false);

  // Note form state
  let noteTitle = $state("");
  let noteContent = $state("");
  let noteType = $state<'general' | 'meeting' | 'transcript'>('general');
  let noteTags = $state<string[]>([]);
  let noteMetadata = $state<Record<string, any>>({});

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
    let filteredNotes = notes ?? [];
    if (activeTag) {
      filteredNotes = filteredNotes.filter(note => note.tags.includes(activeTag as string));
    }
    return [...filteredNotes].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  function getAllTags() {
    const tagSet = new Set<string>();
    notes?.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }

  async function handleAddNote(event: SubmitEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const response = await fetch(`/api/companies/${company.id}/notes`, {
      method: 'POST',
      body: JSON.stringify({
        title: formData.get('title'),
        content: formData.get('content'),
        type: noteType,
        tags: noteTags,
        metadata: noteMetadata
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      showAddNote = false;
      noteTitle = "";
      noteContent = "";
      noteType = 'general';
      noteTags = [];
      noteMetadata = {};
      await invalidate((path) => path.includes('/api/companies'));
    }
  }

  async function handleDeleteNote(noteId: string) {
    const response = await fetch(`/api/companies/${company.id}/notes?noteId=${noteId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      await invalidate((path) => path.includes('/api/companies'));
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
        </CardContent>
      </Card>
    </div>

    <!-- Main Content Area -->
    <div class="lg:col-span-2">
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
                        onclick={() => handleDeleteNote(note.id)}
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
</div> 