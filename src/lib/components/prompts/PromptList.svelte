<script lang="ts">
  import { Search } from "lucide-svelte";
  import { Card, CardHeader, CardTitle, CardContent } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import type { Prompt } from "$lib/types/prompt";

  export let prompts: Prompt[] = [];
  export let selectedPrompt: Prompt | null = null;
  export let searchQuery = "";

  function handlePromptSelect(prompt: Prompt) {
    selectedPrompt = prompt;
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
        bind:value={searchQuery}
      />
    </div>
  </CardHeader>
  <CardContent>
    <div class="border rounded-lg">
      {#each prompts as prompt (prompt.id)}
        <button
          class="w-full px-4 py-3 text-left hover:bg-muted transition-colors
                 border-b last:border-b-0 flex items-center justify-between
                 {selectedPrompt?.id === prompt.id ? 'bg-muted' : ''}"
          onclick={() => handlePromptSelect(prompt)}
        >
          <div>
            <div class="font-medium">{prompt.name}</div>
            <div class="text-sm text-muted-foreground">
              {prompt.model} • {prompt.provider}
            </div>
          </div>
        </button>
      {/each}
    </div>
  </CardContent>
</Card> 