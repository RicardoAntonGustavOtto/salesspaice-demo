<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Card } from "$lib/components/ui/card";
  import { Textarea } from "$lib/components/ui/textarea";
  import { cn } from "$lib/utils";
  import { callProxy } from "$lib/services/apiService";
  import { prompts } from "$lib/promptmanager/prompts.js";
  import type { ModelProvider } from "$lib/services/apiService";
  import { marked } from "marked";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { ChevronDown, ChevronRight, MessageSquare, Plus, Trash2, FolderPlus, Pencil, Folder } from "lucide-svelte";
  import { Separator } from "$lib/components/ui/separator";

  interface ChatFolder {
    id: string;
    name: string;
    created_at: string;
    parent_id: string | null;
  }

  interface ChatSession {
    id: string;
    created_at: string;
    title: string;
    folder_id: string | null;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      citations?: string[];
      timestamp: string;
    }>;
  }

  let userInput = $state("");
  let isLoading = $state(false);
  let currentStreamingContent = $state("");
  let chatHistory = $state<ChatSession['messages']>([]);
  let savedSessions = $state<ChatSession[]>([]);
  let folders = $state<ChatFolder[]>([]);
  let currentSessionId = $state<string | null>(null);
  let editingItemId = $state<string | null>(null);
  let editingName = $state("");
  let expandedFolders = $state<Set<string>>(new Set());

  // Load saved sessions and folders on mount
  onMount(async () => {
    await Promise.all([
      loadSavedSessions(),
      loadFolders()
    ]);
  });

  async function loadSavedSessions() {
    try {
      const { data, error } = await $page.data.supabase
        .from('brainstorm_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      savedSessions = data || [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  async function loadFolders() {
    try {
      const { data, error } = await $page.data.supabase
        .from('brainstorm_folders')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      folders = data || [];
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }

  async function createFolder(parentId: string | null = null) {
    try {
      console.log('Creating new folder with parent:', parentId);
      const newFolder: Partial<ChatFolder> = {
        name: 'New Folder',
        parent_id: parentId,
        created_at: new Date().toISOString()
      };

      console.log('Sending request to create folder:', newFolder);
      const { data, error } = await $page.data.supabase
        .from('brainstorm_folders')
        .insert([newFolder])
        .select('*')
        .single();

      if (error) {
        console.error('Failed to create folder:', error);
        return;
      }
      
      console.log('Folder created successfully:', data);
      folders = [...folders, data];
      // Automatically expand the parent folder if it exists
      if (parentId) {
        expandedFolders = new Set([...expandedFolders, parentId]);
      }
      // Start editing the new folder name immediately
      editingItemId = data.id;
      editingName = data.name;
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }

  async function deleteFolder(folderId: string) {
    try {
      // First update all sessions in this folder to have no folder
      await $page.data.supabase
        .from('brainstorm_sessions')
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      // Then delete the folder
      const { error } = await $page.data.supabase
        .from('brainstorm_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      folders = folders.filter(f => f.id !== folderId);
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  }

  async function renameItem(id: string, newName: string, isFolder: boolean = false) {
    try {
      const table = isFolder ? 'brainstorm_folders' : 'brainstorm_sessions';
      const field = isFolder ? 'name' : 'title';

      const { error } = await $page.data.supabase
        .from(table)
        .update({ [field]: newName })
        .eq('id', id);

      if (error) throw error;

      if (isFolder) {
        folders = folders.map(f => 
          f.id === id ? { ...f, name: newName } : f
        );
      } else {
        savedSessions = savedSessions.map(s => 
          s.id === id ? { ...s, title: newName } : s
        );
      }
      
      editingItemId = null;
      editingName = "";
    } catch (error) {
      console.error('Failed to rename item:', error);
    }
  }

  async function moveSession(sessionId: string, folderId: string | null) {
    try {
      const { error } = await $page.data.supabase
        .from('brainstorm_sessions')
        .update({ folder_id: folderId })
        .eq('id', sessionId);

      if (error) throw error;

      savedSessions = savedSessions.map(s => 
        s.id === sessionId ? { ...s, folder_id: folderId } : s
      );
    } catch (error) {
      console.error('Failed to move session:', error);
    }
  }

  function toggleFolder(folderId: string) {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    expandedFolders = newExpanded;
  }

  function handleDragStart(e: DragEvent, sessionId: string) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', sessionId);
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e: DragEvent, folderId: string | null) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  }

  async function handleDrop(e: DragEvent, folderId: string | null) {
    e.preventDefault();
    const sessionId = e.dataTransfer!.getData('text/plain');
    await moveSession(sessionId, folderId);
  }

  // Update the createNewSession function to support folders
  async function createNewSession(folderId: string | null = null) {
    try {
      const newSession: Partial<ChatSession> = {
        title: `Brainstorm Session ${new Date().toLocaleString()}`,
        messages: [],
        folder_id: folderId
      };

      console.log('Creating new session:', newSession);
      const { data, error } = await $page.data.supabase
        .from('brainstorm_sessions')
        .insert([newSession])
        .select()
        .single();

      if (error) {
        console.error('Failed to create session:', error);
        return;
      }
      
      console.log('Session created:', data);
      currentSessionId = data.id;
      chatHistory = [];
      savedSessions = [data, ...savedSessions];
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }

  async function loadSession(sessionId: string) {
    try {
      const { data, error } = await $page.data.supabase
        .from('brainstorm_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      
      currentSessionId = sessionId;
      chatHistory = data.messages;
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }

  async function updateSession() {
    if (!currentSessionId) return;

    try {
      const { error } = await $page.data.supabase
        .from('brainstorm_sessions')
        .update({
          messages: chatHistory,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  async function deleteSession(sessionId: string) {
    try {
      const { error } = await $page.data.supabase
        .from('brainstorm_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      savedSessions = savedSessions.filter(s => s.id !== sessionId);
      if (currentSessionId === sessionId) {
        currentSessionId = null;
        chatHistory = [];
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  const systemPrompt = `You are an AI assistant helping with business analysis and research. 
  Consider all available company data and provide insights on:
  - Market opportunities
  - Competitive advantages
  - Potential risks
  - Strategic recommendations

  Please format your responses with clear sections using markdown and bullet points.
  When citing sources, use numbered citations in square brackets [1], [2], etc.



  Example:
  This is a claim supported by research [1] and another interesting fact [2].

`;

  function getPrompt(type: keyof typeof prompts.prompts, variables: Record<string, any>) {
    const promptConfig = prompts.prompts[type];
    if (!promptConfig) {
      throw new Error(`Prompt type "${type}" not found`);
    }
    return {
      prompt: promptConfig.content.replace(/{{(\w+)}}/g, (_, key) => variables[key] || ''),
      model: promptConfig.model,
      provider: promptConfig.provider
    };
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!userInput.trim()) return;
    if (!currentSessionId) {
      await createNewSession();
    }
    
    isLoading = true;
    currentStreamingContent = "";
    const newMessage = {
      role: 'user' as const,
      content: userInput,
      timestamp: new Date().toISOString()
    };
    chatHistory = [...chatHistory, newMessage];
    
    try {
      const { prompt, model, provider } = getPrompt("brainstorm_analysis", {
        user_input: userInput,
        system_prompt: systemPrompt,
        chat_history: chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      });

      const response = await callProxy(prompt, provider as ModelProvider, model);
      
      const content = typeof response === 'string' 
        ? response 
        : response?.choices?.[0]?.message?.content || '';

      const citations = Array.isArray(response?.citations) ? response.citations : [];

      const assistantMessage = {
        role: 'assistant' as const,
        content,
        citations,
        timestamp: new Date().toISOString()
      };

      chatHistory = [...chatHistory, assistantMessage];
      await updateSession();
      
    } catch (error) {
      console.error('API call failed:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      chatHistory = [...chatHistory, errorMessage];
      await updateSession();
    } finally {
      isLoading = false;
      userInput = "";
      currentStreamingContent = "";
    }
  }

  function formatContentWithClickableCitations(content: string, citations: string[] = []): string {
    // Replace numbered citations [n] with clickable links to the source URLs
    return content.replace(/\[(\d+)\](?!\:)/g, (match, num) => {
      const index = parseInt(num) - 1;
      const url = citations[index];
      if (url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary/80 no-underline">[${num}]</a>`;
      }
      return match;
    });
  }
</script>

<div class="h-screen flex">
  <!-- Left Sidebar -->
  <div class="w-72 border-r border-border bg-card flex flex-col">
    <div class="p-4">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="font-semibold text-lg">Chat History</h2>
          <p class="text-sm text-muted-foreground">Your brainstorming sessions</p>
        </div>
        <div class="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onclick={e => {
              e.stopPropagation();
              createFolder(null);
            }}
            title="New Folder"
          >
            <FolderPlus class="h-4 w-4" />
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onclick={e => {
              e.stopPropagation();
              createNewSession(null);
            }}
            class="gap-2"
            title="New Chat"
          >
            <Plus class="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      <div class="space-y-1">
        {#if savedSessions.length === 0 && folders.length === 0}
          <div class="text-sm text-muted-foreground text-center py-8">
            <div class="mb-2">
              <MessageSquare class="h-8 w-8 mx-auto text-muted-foreground/50" />
            </div>
            <p>No chat history yet</p>
            <p class="text-xs mt-1">Start a new chat to begin brainstorming</p>
          </div>
        {:else}
          <!-- Root level sessions -->
          {#each savedSessions.filter(s => !s.folder_id) as session (session.id)}
            <div
              draggable={true}
              ondragstart={e => handleDragStart(e, session.id)}
              class="w-full"
            >
            <button 
              class={cn(
                "w-full group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors text-left",
                currentSessionId === session.id && "bg-accent"
              )}
              onclick={() => loadSession(session.id)}
              >
                <MessageSquare class="h-4 w-4 text-muted-foreground shrink-0" />
                {#if editingItemId === session.id}
                  <input
                    type="text"
                    bind:value={editingName}
                    class="flex-1 bg-transparent border-none focus:outline-none text-sm"
                    onblur={() => {
                      if (editingName.trim()) {
                        renameItem(session.id, editingName);
                      } else {
                        editingItemId = null;
                        editingName = session.title;
                      }
                    }}
                    onkeydown={e => {
                      if (e.key === 'Enter') {
                        if (editingName.trim()) {
                          renameItem(session.id, editingName);
                        }
                      } else if (e.key === 'Escape') {
                        editingItemId = null;
                        editingName = session.title;
                      }
                    }}
                  />
                {:else}
                  <span class="text-sm truncate flex-1">
                    {session.title}
                  </span>
                {/if}
                <div class="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onclick={(e) => {
                      e.stopPropagation();
                      editingItemId = session.id;
                      editingName = session.title;
                    }}
                    title="Rename"
                  >
                    <Pencil class="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onclick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this chat?')) {
                        deleteSession(session.id);
                      }
                    }}
                    title="Delete Chat"
                  >
                    <Trash2 class="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </button>
            </div>
          {/each}

          <!-- Folders -->
          {#each folders.filter(f => !f.parent_id) as folder (folder.id)}
            <div
              class="space-y-1"
              ondragover={e => handleDragOver(e, folder.id)}
              ondrop={e => handleDrop(e, folder.id)}
            >
              <button
                class="w-full group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors text-left"
                onclick={() => toggleFolder(folder.id)}
              >
                {#if expandedFolders.has(folder.id)}
                  <ChevronDown class="h-4 w-4 text-muted-foreground shrink-0" />
                {:else}
                  <ChevronRight class="h-4 w-4 text-muted-foreground shrink-0" />
                {/if}
                <Folder class="h-4 w-4 text-muted-foreground shrink-0" />
                {#if editingItemId === folder.id}
                  <input
                    type="text"
                    bind:value={editingName}
                    class="flex-1 bg-transparent border-none focus:outline-none text-sm"
                    onblur={() => {
                      if (editingName.trim()) {
                        renameItem(folder.id, editingName, true);
                      } else {
                        editingItemId = null;
                        editingName = folder.name;
                      }
                    }}
                    onkeydown={e => {
                      if (e.key === 'Enter') {
                        if (editingName.trim()) {
                          renameItem(folder.id, editingName, true);
                        }
                      } else if (e.key === 'Escape') {
                        editingItemId = null;
                        editingName = folder.name;
                      }
                    }}
                  />
                {:else}
                  <span class="text-sm truncate flex-1">
                    {folder.name}
                  </span>
                {/if}
                <div class="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onclick={(e) => {
                      e.stopPropagation();
                      editingItemId = folder.id;
                      editingName = folder.name;
                    }}
                    title="Rename"
                  >
                    <Pencil class="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onclick={(e) => {
                      e.stopPropagation();
                      createNewSession(folder.id);
                    }}
                    title="New Chat in Folder"
                  >
                    <Plus class="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onclick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this folder?')) {
                        deleteFolder(folder.id);
                      }
                    }}
                    title="Delete Folder"
                  >
                    <Trash2 class="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </button>

              {#if expandedFolders.has(folder.id)}
                <div class="ml-6 space-y-1">
                  {#each savedSessions.filter(s => s.folder_id === folder.id) as session (session.id)}
                    <div
                      draggable={true}
                      ondragstart={e => handleDragStart(e, session.id)}
                      class="w-full"
                    >
                      <button 
                        class={cn(
                          "w-full group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors text-left",
                          currentSessionId === session.id && "bg-accent"
                        )}
                        onclick={() => loadSession(session.id)}
            >
              <MessageSquare class="h-4 w-4 text-muted-foreground shrink-0" />
                        {#if editingItemId === session.id}
                          <input
                            type="text"
                            bind:value={editingName}
                            class="flex-1 bg-transparent border-none focus:outline-none text-sm"
                            onblur={() => {
                              if (editingName.trim()) {
                                renameItem(session.id, editingName);
                              } else {
                                editingItemId = null;
                                editingName = session.title;
                              }
                            }}
                            onkeydown={e => {
                              if (e.key === 'Enter') {
                                if (editingName.trim()) {
                                  renameItem(session.id, editingName);
                                }
                              } else if (e.key === 'Escape') {
                                editingItemId = null;
                                editingName = session.title;
                              }
                            }}
                          />
                        {:else}
              <span class="text-sm truncate flex-1">
                {session.title}
              </span>
                        {/if}
                        <div class="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onclick={(e) => {
                              e.stopPropagation();
                              editingItemId = session.id;
                              editingName = session.title;
                            }}
                            title="Rename"
                          >
                            <Pencil class="h-3 w-3 text-muted-foreground" />
                          </Button>
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onclick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this chat?')) {
                    deleteSession(session.id);
                  }
                }}
                title="Delete Chat"
              >
                <Trash2 class="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
                        </div>
            </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- Main Chat Area -->
  <div class="flex-1 flex flex-col min-h-0">
    <div class="border-b p-4 bg-card/50">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-2xl font-bold">AI Brainstorming Assistant</h1>
        <p class="text-muted-foreground">Explore ideas and analyze business opportunities</p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div class="max-w-3xl mx-auto">
        <div class="space-y-6">
          {#each chatHistory as message}
            <Card class={cn(
              "p-4",
              message.role === 'assistant' ? "bg-card" : "bg-accent/50 dark:bg-accent"
            )}>
              <div class="flex items-start gap-3">
                <div class={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  message.role === 'assistant' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {#if message.role === 'assistant'}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect>
                      <path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>
                    </svg>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  {/if}
                </div>
                <div class="flex-1">
                  <div class="prose prose-sm max-w-none dark:prose-invert">
                    {@html marked(formatContentWithClickableCitations(message.content, message.citations || []))}
                  </div>
                  {#if message.citations && message.citations.length > 0}
                    <div class="mt-4 pt-4 border-t border-border">
                      <h4 class="text-sm font-semibold mb-2">Sources:</h4>
                      <ul class="space-y-1">
                        {#each message.citations as citation, index}
                          <li class="text-sm">
                            <span class="text-muted-foreground">[{index + 1}]:</span>
                            <a 
                              href={citation}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-primary hover:text-primary/80 ml-2"
                            >
                              {citation}
                            </a>
                          </li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                </div>
              </div>
            </Card>
          {/each}

          {#if isLoading && currentStreamingContent}
            <Card class="p-4 bg-card">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect>
                    <path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="prose prose-sm max-w-none dark:prose-invert">
                    {@html marked(formatContentWithClickableCitations(currentStreamingContent, []))}
                  </div>
                </div>
              </div>
            </Card>
          {:else if isLoading}
            <Card class="p-4 bg-card">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </Card>
          {/if}
        </div>
      </div>
    </div>

    <div class="border-t bg-card/50">
      <div class="max-w-3xl mx-auto p-4">
        <form 
          class="flex gap-2"
          onsubmit={handleSubmit}
        >
          <Textarea
            bind:value={userInput}
            placeholder="Ask anything about your business data..."
            class="flex-1 resize-none"
            rows={3}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !userInput.trim()}
            class="self-end px-6"
          >
            {#if isLoading}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              Send
            {/if}
          </Button>
        </form>

        <Separator class="my-4" />

        <div class="text-sm text-muted-foreground">
          <p class="font-medium">Suggested prompts:</p>
          <div class="mt-2 flex flex-wrap gap-2">
            {#each [
              "Analyze market position",
              "Explore opportunities",
              "Identify risks",
              "Improve business model"
            ] as prompt}
              <button
                class="px-3 py-1.5 rounded-full bg-accent/50 hover:bg-accent transition-colors text-sm"
                onclick={() => userInput = prompt}
              >
                {prompt}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
