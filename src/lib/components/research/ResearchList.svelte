<!-- @format -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import type { ResearchResult } from "$lib/types/company";

  export let researchResults: ResearchResult[] = [];
  export let onview: (event: CustomEvent<{ research: ResearchResult; index: number }>) => void;
  export let ondelete: (event: CustomEvent<{ index: number }>) => void;

  function handleView(research: ResearchResult, index: number) {
    onview(new CustomEvent('view', { detail: { research, index } }));
  }

  function handleDelete(index: number) {
    ondelete(new CustomEvent('delete', { detail: { index } }));
  }
</script>

<div class="space-y-4">
  {#if researchResults.length > 0}
    {#each researchResults as research, index}
      <Card>
        <CardHeader>
          <CardTitle class="flex justify-between items-center text-lg">
            <span>Research {index + 1}</span>
            <span class="text-sm text-muted-foreground">
              {new Date(research.research_date).toLocaleDateString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground line-clamp-3 mb-4">
            {research.research_content}
          </p>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onclick={() => handleView(research, index)}
            >
              View
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onclick={() => handleDelete(index)}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    {/each}
  {:else}
    <p class="text-muted-foreground text-center py-4">No research results available.</p>
  {/if}
</div> 