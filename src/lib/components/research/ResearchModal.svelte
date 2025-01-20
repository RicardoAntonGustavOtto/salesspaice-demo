<!-- @format -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
  import { Textarea } from "$lib/components/ui/textarea";
  import type { ResearchResult } from "$lib/types/company";

  export let show = false;
  export let loading = false;
  export let error: string | null = null;
  export let research: ResearchResult | null = null;
  export let editedContent = "";
  export let close: () => void;
  export let save: (event: CustomEvent<{ content: string }>) => void;

  function handleSave() {
    save(new CustomEvent('save', { detail: { content: editedContent } }));
  }
</script>

<Dialog open={show} onOpenChange={close}>
  <DialogContent class="sm:max-w-[725px]">
    <DialogHeader>
      <DialogTitle>Edit Research</DialogTitle>
    </DialogHeader>

    {#if error}
      <div class="text-destructive text-sm">{error}</div>
    {/if}

    <div class="grid gap-4 py-4">
      <Textarea
        bind:value={editedContent}
        rows={15}
        placeholder="Research content..."
        disabled={loading}
      />

      {#if research?.citations && research.citations.length > 0}
        <div class="border-t pt-4">
          <h3 class="text-lg font-semibold mb-2">Sources:</h3>
          <ul class="space-y-2">
            {#each research.citations as citation}
              <li>
                <a
                  href={citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:text-primary/80 text-sm"
                >
                  {citation}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={close} disabled={loading}>
        Cancel
      </Button>
      <Button onclick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog> 