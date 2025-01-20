<script lang="ts">
  import { Edit, X } from "lucide-svelte";
  import { MODEL_OPTIONS } from "$lib/config/models";
  import type { Prompt } from "$lib/types/prompt";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Select from "$lib/components/ui/select";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "$lib/components/ui/card";
  import { createEventDispatcher } from 'svelte';

  export let prompt: Prompt;
  export let isEditing = false;

  let editForm: Prompt;
  $: editForm = { ...prompt };

  const dispatch = createEventDispatcher();

  function handleModelChange(value: string) {
    console.log('Model changed to:', value);
    if (MODEL_OPTIONS[value]) {
      editForm = {
        ...editForm,
        model: value,
        provider: MODEL_OPTIONS[value].provider
      };
    }
  }

  $: triggerContent = MODEL_OPTIONS[editForm.model]?.label ?? 'Select a model';

  function handleSave() {
    dispatch('save', editForm);
    isEditing = false;
  }

  function handleCancel() {
    editForm = { ...prompt };
    isEditing = false;
  }
</script>

<Card>
  <CardHeader>
    <div class="flex justify-between items-center">
      <CardTitle>{prompt.name}</CardTitle>
      <Button 
        variant="ghost" 
        size="icon"
        onclick={() => isEditing = !isEditing}
        class="hover:bg-muted"
      >
        {#if isEditing}
          <X class="h-4 w-4" />
        {:else}
          <Edit class="h-4 w-4" />
        {/if}
      </Button>
    </div>
    <CardDescription>
      {prompt.model} • {prompt.provider}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      {#if isEditing}
        <div class="text-sm text-blue-500">
          Editing mode active
        </div>
      {/if}

      <div class="space-y-2">
        <Label for="model">Model</Label>
        {#if isEditing}
          <Select.Root 
            type="single" 
            bind:value={editForm.model}
          >
            <Select.Trigger class="w-full">
              {triggerContent}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.GroupHeading>Available Models</Select.GroupHeading>
                {#each Object.entries(MODEL_OPTIONS) as [value, { label }]}
                  <Select.Item {value} {label} />
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        {:else}
          <Input
            value={MODEL_OPTIONS[editForm.model]?.label ?? editForm.model}
            disabled
          />
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="provider">Provider</Label>
        <Input
          id="provider"
          value={editForm.provider}
          disabled
          class="capitalize"
        />
      </div>

      <div class="space-y-2">
        <Label for="content">Prompt Content</Label>
        <Textarea
          id="content"
          bind:value={editForm.content}
          disabled={!isEditing}
          rows={15}
          class="font-mono text-sm"
        />
      </div>
    </div>
  </CardContent>
  {#if isEditing}
    <CardFooter class="flex justify-end gap-2">
      <Button variant="outline" onclick={handleCancel}>
        Cancel
      </Button>
      <Button onclick={handleSave}>
        Save Changes
      </Button>
    </CardFooter>
  {/if}
</Card> 