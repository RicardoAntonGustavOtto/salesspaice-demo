<script lang="ts">
  import PromptList from "$lib/components/prompts/PromptList.svelte";
  import PromptEditor from "$lib/components/prompts/PromptEditor.svelte";
  import type { Prompt } from "$lib/types/prompt";
  import { PromptService } from "$lib/services/promptService";
  import { prompts as initialPrompts } from "$lib/promptmanager/prompts.js";

  const promptService = new PromptService(initialPrompts.prompts);
  
  let promptsArray = promptService.getAllPrompts();
  let selectedPrompt: Prompt | null = null;
  let searchQuery = "";

  $: filteredPrompts = promptsArray.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handlePromptSave(event: CustomEvent<Prompt>) {
    const updatedPrompt = event.detail;
    promptService.updatePrompt(updatedPrompt.name, updatedPrompt);
    promptsArray = promptService.getAllPrompts();
    selectedPrompt = updatedPrompt;
  }
</script>

<div class="container mx-auto py-6 space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-bold tracking-tight">Prompt Manager</h1>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <PromptList
      prompts={filteredPrompts}
      bind:selectedPrompt
      bind:searchQuery
    />

    {#if selectedPrompt}
      <PromptEditor
        prompt={selectedPrompt}
        on:save={handlePromptSave}
      />
    {/if}
  </div>
</div>
