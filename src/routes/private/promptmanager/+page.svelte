<script lang="ts">
  import PromptList from "$lib/components/prompts/PromptList.svelte";
  import PromptEditor from "$lib/components/prompts/PromptEditor.svelte";
  import type { Prompt } from "$lib/types/prompt";
  import { page } from "$app/stores";
  import { invalidate } from "$app/navigation";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";

  let { data } = $derived($page);
  let supabase = $derived($page.data.supabase);
  let promptsArray = $derived(data.prompts);
  let selectedPrompt = $state<Prompt | null>(null);
  let searchQuery = $state("");
  let promptToDelete = $state<string | null>(null);

  let filteredPrompts = $derived(
    promptsArray.filter((p: Prompt) => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  async function handlePromptSave(event: CustomEvent<Prompt>) {
    const updatedPrompt = event.detail;
    
    if (selectedPrompt) {
      const { error } = await supabase
        .from('prompts')
        .update(updatedPrompt)
        .eq('id', selectedPrompt.id);

      if (error) {
        console.error('Error updating prompt:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('prompts')
        .insert(updatedPrompt);

      if (error) {
        console.error('Error creating prompt:', error);
        return;
      }
    }

    await invalidate('supabase:prompts');
    selectedPrompt = updatedPrompt;
  }

  async function handlePromptDelete() {
    if (!promptToDelete) return;

    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptToDelete);

    if (error) {
      console.error('Error deleting prompt:', error);
      return;
    }

    await invalidate('supabase:prompts');
    if (selectedPrompt?.id === promptToDelete) {
      selectedPrompt = null;
    }
    promptToDelete = null;
  }

  function handlePromptSelect(prompt: Prompt) {
    selectedPrompt = prompt;
  }

  function handleSearch(query: string) {
    searchQuery = query;
  }
</script>

<Dialog open={!!promptToDelete} onOpenChange={() => (promptToDelete = null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Prompt</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete this prompt? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={() => (promptToDelete = null)}>Cancel</Button>
      <Button variant="destructive" onclick={handlePromptDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<div class="container mx-auto py-6 px-6 space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-bold tracking-tight">Prompt Manager</h1>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <PromptList
      prompts={filteredPrompts}
      {selectedPrompt}
      {searchQuery}
      onSelect={handlePromptSelect}
      onDelete={(id) => (promptToDelete = id)}
      onSearch={handleSearch}
    />

    {#if selectedPrompt}
      <PromptEditor
        prompt={selectedPrompt}
        on:save={handlePromptSave}
      />
    {/if}
  </div>
</div>
