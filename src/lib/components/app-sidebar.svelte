<!-- @format -->
<script lang="ts" module>
	import AudioWaveform from "lucide-svelte/icons/audio-waveform";
	import Blocks from "lucide-svelte/icons/blocks";
	import Calendar from "lucide-svelte/icons/calendar";
	import Command from "lucide-svelte/icons/command";
	import House from "lucide-svelte/icons/house";
	import Code from "lucide-svelte/icons/code";
	import Inbox from "lucide-svelte/icons/inbox";
	import MessageCircleQuestion from "lucide-svelte/icons/message-circle-question";
	import Search from "lucide-svelte/icons/search";
	import Settings2 from "lucide-svelte/icons/settings-2";
	import Sparkles from "lucide-svelte/icons/sparkles";
	import LogOut from "lucide-svelte/icons/log-out";
	import Trash2 from "lucide-svelte/icons/trash-2";
	import Building2 from "lucide-svelte/icons/building-2";

	// Base navigation data
	const navMain = [
		{
			title: "Ask AI",
			url: "/private/brainstorm",
			icon: Sparkles,
		},
		{
			title: "dashboard",
			url: "#",
			icon: House,
			isActive: true,
		},
		{
			title: "company data",
			url: "/private/masterdata",
			icon: Building2,
			isActive: false,
		},
		{
			title: "Prospecting",
			url: "/private/targetcompanyresearch",
			icon: Building2,
			isActive: false,
		},
	];

	const navSecondary = [
		{
			title: "Promptmanager",
			url: "/private/promptmanager",
			icon: Code,
		},
		{
			title: "Logout",
			url: "#",
			icon: LogOut,
		},
	];
</script>

<script lang="ts">
	import NavFavorites from "$lib/components/nav-favorites.svelte";
	import NavMain from "$lib/components/nav-main.svelte";
	import NavSecondary from "$lib/components/nav-secondary.svelte";
	import NavWorkspaces from "$lib/components/nav-workspaces.svelte";
	import TeamSwitcher from "$lib/components/team-switcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
	import { ownCompany } from "$lib/stores/ownCompany";
	import { page } from "$app/stores";

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	// Get user email from supabase session
	let userEmail = $derived($page.data?.session?.user?.email || '');
	let userName = $derived(userEmail.split('@')[0]);

	// Reactive data object
	let data = $derived({
		teams: [
			{
				name: userName ? `${userName} - ${$ownCompany.name || 'SalesSpaice'}` : 'SalesSpaice',
				logo: Command,
				plan: "Enterprise",
			},
		],
		navMain,
		navSecondary,
		favorites: [],
		targetCompanies: [],
	});
</script>

<Sidebar.Root bind:ref class="border-r-0" {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher teams={data.teams} />
		<NavMain items={data.navMain} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavFavorites favorites={data.favorites} />
		<NavWorkspaces workspaces={data.targetCompanies} />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
