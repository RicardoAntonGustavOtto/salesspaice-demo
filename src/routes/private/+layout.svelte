<script lang="ts">

	import "../../app.css";
	import { page } from "$app/stores";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import NavActions from "$lib/components/nav-actions.svelte";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import BreadcrumbSeparator from "$lib/components/ui/breadcrumb/breadcrumb-separator.svelte";

	const pathSegments = $derived(
		$page.url.pathname.split("/").filter(Boolean),
	);

	let { data, children } = $props()
  let { supabase } = $derived(data)

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {	
      console.error(error)
    }
  }
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="flex h-14 shrink-0 items-center gap-2">
			<div class="flex flex-1 items-center gap-2 px-3">
				<Sidebar.Trigger />
				<Separator orientation="vertical" class="mr-2 h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
							<Breadcrumb.Item>
								<Breadcrumb.Link href="/">Home </Breadcrumb.Link>
							</Breadcrumb.Item>
							<BreadcrumbSeparator />
							{#each pathSegments as segment, i}
								<Breadcrumb.Item>
									{#if i === pathSegments.length - 1}
									<Breadcrumb.Page
										class="line-clamp-1 capitalize"
									>
										{segment.replace(/-/g, " ")}
									</Breadcrumb.Page>
								{:else}
                {#if segment !== "private"}
									<Breadcrumb.Link
										href={`/${pathSegments.slice(0, i + 1).join("/")}`}
										class="capitalize"
									>
										{segment.replace(/-/g, " ")}
									</Breadcrumb.Link>
                  <BreadcrumbSeparator />
                  {/if}
								{/if}
							</Breadcrumb.Item>
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 px-4 py-10">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
