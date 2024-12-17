<!-- @format -->
<script lang="ts" module>
  import Command from "lucide-svelte/icons/command";
  import Users from "lucide-svelte/icons/users";
  import * as Collapsible from "$lib/components/ui/collapsible/index.js";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import Calendar from "lucide-svelte/icons/calendar";

  let items: {
    title: string;
    url: string;
    // this should be `Component` after lucide-svelte updates types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];

  let tools: {
    title: string;
    url: string;
    // this should be `Component` after lucide-svelte updates types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];

  let dataManagements: {
    title: string;
    url: string;
    // this should be `Component` after lucide-svelte updates types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  // sample data
  const data = {
    versions: ["Devii.io"],
    navMain: [
      {
        title: "Master Data",
        url: "/private/masterdata",
        icon: Command,
      },
    ],
    navTools: [
      {
        title: "Target Company Research",
        url: "/private/targetcompanyresearch",
        icon: Users,
      },
      {
        title: "EventSpaice",
        url: "/private/events",
        icon: Calendar,
      },
    ],
    navDataManagement: [
      {
        title: "Overview",
        url: "#",
        icon: Command,
      },
      {
        title: "Cold Calls",
        url: "#",
        icon: Command,
      },
      {
        title: "Email Drafts",
        url: "#",
        icon: Command,
      },
      {
        title: "Target Company Research",
        url: "#",
        icon: Command,
      },
    ],
  };

  items = data.navMain;
  tools = data.navTools;
  dataManagements = data.navDataManagement;
</script>

<script lang="ts">
  import VersionSwitcher from "$lib/components/VersionSwitcher.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import type { ComponentProps } from "svelte";

  let {
    ref = $bindable(null),
    collapsible = "icon",
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {...restProps} bind:ref {collapsible}>
  <Sidebar.Header>
    <VersionSwitcher
      versions={data.versions}
      defaultVersion={data.versions[0]}
    />
  </Sidebar.Header>
  <Sidebar.Content>
    <!-- We create a Sidebar.Group for each parent. -->
    <Sidebar.Group>
      <Sidebar.GroupLabel>Your Organisation</Sidebar.GroupLabel>
      <Sidebar.Menu>
        {#each items as mainItem (mainItem.title)}
          <Sidebar.MenuItem>
            <Sidebar.MenuButton>
              <a href={mainItem.url} class="flex items-center gap-2">
                {#if mainItem.icon}
                  <mainItem.icon class="size-4" />
                {/if}
                <span>{mainItem.title}</span>
              </a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        {/each}
      </Sidebar.Menu>
    </Sidebar.Group>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Tools</Sidebar.GroupLabel>
      <Sidebar.Menu>
        {#each tools as mainItem (mainItem.title)}
          <Sidebar.MenuItem>
            <Sidebar.MenuButton>
              <a href={mainItem.url} class="flex items-center gap-2">
                {#if mainItem.icon}
                  <mainItem.icon class="size-4" />
                {/if}
                <span>{mainItem.title}</span>
              </a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        {/each}
      </Sidebar.Menu>
    </Sidebar.Group>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Data Management</Sidebar.GroupLabel>
      <Sidebar.Menu>
        {#each dataManagements as mainItem (mainItem.title)}
          <Sidebar.MenuItem>
            <Sidebar.MenuButton>
              {#if mainItem.icon}
                <mainItem.icon />
              {/if}
              <span>{mainItem.title}</span>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        {/each}
      </Sidebar.Menu>
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Rail />
</Sidebar.Root>
