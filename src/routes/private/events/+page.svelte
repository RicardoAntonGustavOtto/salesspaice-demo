<!-- @format -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
</script>

<div class="container mx-auto py-8">
  <h1 class="text-3xl font-bold mb-8">Upcoming Events</h1>

  <Card class="p-4">
    <div class="flex items-center gap-4">
      <img
        src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"
        alt="Developers Week 2025"
        class="h-16 w-16 object-cover rounded"
      />
      <div class="flex-1">
        <h2 class="text-lg font-semibold">Developers Week 2025</h2>
        <p class="text-sm text-muted-foreground">February 11 - 13, 2025</p>
      </div>
      <Button
        variant="default"
        size="sm"
        href="/private/events/developerweek2025"
      >
        View Details
      </Button>
    </div>
  </Card>
</div>
