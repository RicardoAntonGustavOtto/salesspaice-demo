<!-- @format -->
<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import AppSidebar from "$lib/components/AppSidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  import { page } from "$app/stores";
  import { breadcrumbs } from "$lib/stores/breadcrumbs";
  import { derived } from "svelte/store";

  let { data, children } = $props();
  let { supabase } = $derived(data);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
  };

  // Derive the current breadcrumb path
  const currentBreadcrumbs = derived(
    [page, breadcrumbs],
    ([$page, $breadcrumbs]) => {
      const path = $page.url.pathname;
      const breadcrumbPath = [];

      $breadcrumbs.forEach((breadcrumb) => {
        if (path.startsWith(breadcrumb.path)) {
          breadcrumbPath.push(breadcrumb);
        }
      });

      return breadcrumbPath;
    }
  );
</script>

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <Sidebar.Trigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <Breadcrumb.Root>
        <Breadcrumb.List>
          {#each $currentBreadcrumbs as breadcrumb, i}
            <Breadcrumb.Item class="hidden md:block">
              <Breadcrumb.Link href={breadcrumb.path}
                >{breadcrumb.name}</Breadcrumb.Link
              >
            </Breadcrumb.Item>
            {#if i !== $currentBreadcrumbs.length - 1}
              <Breadcrumb.Separator class="hidden md:block" />
            {/if}
          {/each}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </header>
    <main class="bg-slate-50">
      {@render children?.()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
