<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Calendar, FileText, MessageSquare, Building2, Globe, MapPin, Users, Clock, Link } from "lucide-svelte";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "$lib/components/ui/dialog";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Badge } from "$lib/components/ui/badge";
  import { invalidate } from "$app/navigation";
  import { formatDistanceToNow } from 'date-fns';
  import type { PageData } from "./$types";

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
    type: 'note' | 'transcript';
    summary?: string;
    duration?: string;
    meeting_id?: string;
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

  let { data } = $props<PageData>();
  let { company, notes, meetings, transcripts } = $derived<{
    company: TargetCompany;
    notes: Note[];
    meetings: Meeting[];
    transcripts: Transcript[];
  }>(data);

  let activeTab = $state('all');
  let showAddNote = $state(false);
  let showScheduleMeeting = $state(false);

  // Note form state
  let noteTitle = $state("");
  let noteContent = $state("");

  // Meeting form state
  let meetingTitle = $state("");
  let meetingDate = $state("");
  let meetingTime = $state("");
  let meetingLocation = $state("");
  let meetingAttendees = $state("");
  let meetingSummary = $state("");

  let filteredNotes = $derived(() => {
    if (activeTab === 'all') return notes;
    return notes.filter(note => note.type === activeTab);
  });

  function formatDate(date: string) {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function getUpcomingMeetings() {
    const now = new Date();
    return meetings?.filter(m => new Date(m.scheduled_for) >= now)
      .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()) ?? [];
  }

  function getPastMeetings() {
    const now = new Date();
    return meetings?.filter(m => new Date(m.scheduled_for) < now)
      .sort((a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime()) ?? [];
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
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      showAddNote = false;
      noteTitle = "";
      noteContent = "";
      await invalidate('notes');
    }
  }

  async function handleScheduleMeeting(event: SubmitEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const dateTime = `${formData.get('date')}T${formData.get('time')}`;
    const attendeesList = formData.get('attendees')?.toString().split(',').map(a => a.trim()) ?? [];

    const response = await fetch(`/api/companies/${company.id}/meetings`, {
      method: 'POST',
      body: JSON.stringify({
        title: formData.get('title'),
        scheduled_for: dateTime,
        location: formData.get('location'),
        attendees: attendeesList,
        summary: formData.get('summary')
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      showScheduleMeeting = false;
      meetingTitle = "";
      meetingDate = "";
      meetingTime = "";
      meetingLocation = "";
      meetingAttendees = "";
      meetingSummary = "";
      await invalidate('meetings');
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
      <div class="flex gap-2">
        <Button variant="outline" onclick={() => showScheduleMeeting = true}>
          <Calendar class="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
        <Button onclick={() => showAddNote = true}>
          <Plus class="w-4 h-4 mr-2" />
          Add Note
        </Button>
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

      {#if getUpcomingMeetings().length > 0}
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="w-5 h-5" />
              Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              {#each getUpcomingMeetings() as meeting}
                <div class="border-l-2 border-primary pl-4">
                  <h4 class="font-medium">{meeting.title}</h4>
                  <p class="text-sm text-muted-foreground">{formatDate(meeting.scheduled_for)}</p>
                  <p class="text-sm text-muted-foreground">{meeting.location}</p>
                  {#if meeting.attendees?.length}
                    <p class="text-sm mt-1 text-muted-foreground">{meeting.attendees.join(', ')}</p>
                  {/if}
                </div>
              {/each}
            </div>
          </CardContent>
        </Card>
      {/if}
    </div>

    <!-- Main Content Area -->
    <div class="lg:col-span-2">
      <Tabs value={activeTab} class="w-full" onValueChange={(value: string) => activeTab = value}>
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="all" class="flex items-center gap-2">
            <FileText class="w-4 h-4" />
            All ({notes?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="note" class="flex items-center gap-2">
            <FileText class="w-4 h-4" />
            Notes ({notes?.filter(n => n.type === 'note')?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="transcript" class="flex items-center gap-2">
            <MessageSquare class="w-4 h-4" />
            Transcripts ({notes?.filter(n => n.type === 'transcript')?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div class="flex justify-between items-center">
                <div>
                  <CardTitle>All Notes</CardTitle>
                  <CardDescription>All notes related to {company.name}</CardDescription>
                </div>
                <Button onclick={() => showAddNote = true}>
                  <Plus class="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div class="space-y-6">
                {#each filteredNotes as note}
                  <div class="border-l-2 border-primary pl-4 py-2">
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="font-medium">{note.title}</h4>
                      <span class="text-sm text-muted-foreground">{formatDate(note.created_at)}</span>
                    </div>
                    <p class="text-muted-foreground whitespace-pre-line">{note.content}</p>
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

        <TabsContent value="note">
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
            </CardHeader>
            <CardContent>
              <div class="space-y-6">
                {#each filteredNotes.filter(n => n.type === 'note') as note}
                  <div class="border-l-2 border-primary pl-4 py-2">
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="font-medium">{note.title}</h4>
                      <span class="text-sm text-muted-foreground">{formatDate(note.created_at)}</span>
                    </div>
                    <p class="text-muted-foreground whitespace-pre-line">{note.content}</p>
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

        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <CardTitle>Transcripts</CardTitle>
              <CardDescription>Meeting transcripts and recordings</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-6">
                {#each filteredNotes.filter(n => n.type === 'transcript') as note}
                  <div class="border-l-2 border-primary pl-4 py-2">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <h4 class="font-medium">{note.title}</h4>
                        {#if note.duration}
                          <p class="text-sm text-muted-foreground">Duration: {note.duration}</p>
                        {/if}
                      </div>
                      <span class="text-sm text-muted-foreground">{formatDate(note.created_at)}</span>
                    </div>
                    {#if note.summary}
                      <p class="text-muted-foreground mt-2">{note.summary}</p>
                    {/if}
                    <Button variant="link" class="px-0 mt-2">View Full Transcript</Button>
                  </div>
                {:else}
                  <p class="text-muted-foreground">No transcripts available.</p>
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

  <Dialog bind:open={showScheduleMeeting}>
    <DialogContent>
      <form onsubmit={handleScheduleMeeting}>
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Schedule a meeting with {company.name}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="title">Title</Label>
            <Input id="title" name="title" bind:value={meetingTitle} required />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="date">Date</Label>
              <Input id="date" name="date" type="date" bind:value={meetingDate} required />
            </div>
            <div class="grid gap-2">
              <Label for="time">Time</Label>
              <Input id="time" name="time" type="time" bind:value={meetingTime} required />
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="location">Location</Label>
            <Input id="location" name="location" bind:value={meetingLocation} required />
          </div>
          <div class="grid gap-2">
            <Label for="attendees">Attendees (comma-separated)</Label>
            <Input id="attendees" name="attendees" bind:value={meetingAttendees} placeholder="John Doe, Jane Smith" />
          </div>
          <div class="grid gap-2">
            <Label for="summary">Agenda / Summary</Label>
            <Textarea id="summary" name="summary" bind:value={meetingSummary} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onclick={() => showScheduleMeeting = false}>
            Cancel
          </Button>
          <Button type="submit">Schedule Meeting</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</div> 