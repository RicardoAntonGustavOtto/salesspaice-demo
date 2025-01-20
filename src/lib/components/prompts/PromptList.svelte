<script lang="ts">
  import { Search, Trash2 } from "lucide-svelte";
  import { Card, CardHeader, CardTitle, CardContent } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import type { Prompt } from "$lib/types/prompt";

  export let prompts: Prompt[] = [];
  export let selectedPrompt: Prompt | null = null;
  export let searchQuery = "";
  export let onSelect: (prompt: Prompt) => void;
  export let onDelete: (id: string) => void;
  export let onSearch: (query: string) => void;

  function handleSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    onSearch(target.value);
  }

  function handleDelete(id: string, event: Event) {
    event.stopPropagation();
    onDelete(id);
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Prompts</CardTitle>
    <div class="relative">
      <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search prompts..."
        class="pl-8"
        value={searchQuery}
        on:input={handleSearchChange}
      />
    </div>
  </CardHeader>
  <CardContent>
    <div class="border rounded-lg divide-y">
      {#each prompts as prompt (prompt.id)}
        <div
          class="w-full px-4 py-3 text-left hover:bg-muted transition-colors
                 flex items-center justify-between
                 {selectedPrompt?.id === prompt.id ? 'bg-muted' : ''}"
        >
          <button
            class="flex-1 text-left"
            on:click={() => onSelect(prompt)}
          >
            <div class="font-medium">{prompt.name}</div>
            <div class="text-sm text-muted-foreground">
              {prompt.model} • {prompt.provider}
            </div>
          </button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            on:click={(e) => handleDelete(prompt.id, e)}
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      {/each}
    </div>
  </CardContent>
</Card> 