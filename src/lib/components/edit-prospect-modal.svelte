<!-- @format -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import type { ProspectProps, NewProspectProps } from "$lib/types/prospect";

  export let show = false;
  export let loading = false;
  export let error: string | null = null;
  export let prospect: NewProspectProps | undefined = undefined;
  export let close: () => void;
  export let save: (event: CustomEvent<NewProspectProps>) => void;

  let name = prospect?.name || '';
  let title = prospect?.title || '';
  let email = prospect?.email || '';
  let phone = prospect?.phone || '';
  let linkedin = prospect?.linkedin || '';

  $: if (prospect) {
    name = prospect.name;
    title = prospect.title;
    email = prospect.email;
    phone = prospect.phone;
    linkedin = prospect.linkedin;
  }

  function handleSave() {
    save(new CustomEvent('save', {
      detail: {
        name,
        title,
        email,
        phone,
        linkedin
      }
    }));
  }
</script>

<Dialog open={show} onOpenChange={close}>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>{prospect ? 'Edit' : 'Add'} Prospect</DialogTitle>
    </DialogHeader>

    {#if error}
      <div class="text-destructive text-sm">{error}</div>
    {/if}

    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="name">Name</Label>
        <Input
          id="name"
          bind:value={name}
          placeholder="John Doe"
          disabled={loading}
        />
      </div>
      <div class="grid gap-2">
        <Label for="title">Title</Label>
        <Input
          id="title"
          bind:value={title}
          placeholder="CEO"
          disabled={loading}
        />
      </div>
      <div class="grid gap-2">
        <Label for="email">Email</Label>
        <Input
          id="email"
          type="email"
          bind:value={email}
          placeholder="john@example.com"
          disabled={loading}
        />
      </div>
      <div class="grid gap-2">
        <Label for="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          bind:value={phone}
          placeholder="+1 234 567 890"
          disabled={loading}
        />
      </div>
      <div class="grid gap-2">
        <Label for="linkedin">LinkedIn</Label>
        <Input
          id="linkedin"
          bind:value={linkedin}
          placeholder="https://linkedin.com/in/johndoe"
          disabled={loading}
        />
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={close} disabled={loading}>
        Cancel
      </Button>
      <Button onclick={handleSave} disabled={loading}>
        {loading ? "Saving..." : prospect ? "Update" : "Add"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog> 