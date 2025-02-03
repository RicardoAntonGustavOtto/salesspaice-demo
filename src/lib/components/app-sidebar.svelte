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
			title: "Dashboard",
			url: "/private/dashboard",
			icon: Blocks,
		},
		{
			title: "Master Data",
			url: "/private/masterdata",
			icon: Building2,
		},
		{
			title: "Prospecting",
			url: "/private/targetcompanyresearch",
			icon: Building2,
		},
		{
			title: "Events",
			url: "/private/events",
			icon: Calendar,
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
	import { goto } from "$app/navigation";

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	// Get user email from supabase session
	let userEmail = $derived($page.data?.session?.user?.email || '');
	let userName = $derived(userEmail.split('@')[0]);

	// Add logout handler
	async function handleLogout() {
		const { error } = await $page.data.supabase.auth.signOut();
		if (!error) {
			goto('/');
		}
	}

	// Function to check if a URL matches the current path
	function isActive(url: string) {
		if (url === '#') return false;
		const currentPath = $page.url.pathname;
		// Check if the URL is the current path or if it's a parent path
		return currentPath === url || 
			   (url !== '/private' && currentPath.startsWith(url)) ||
			   // Special case for company details page
			   (url === '/private/companies' && currentPath.startsWith('/private/companies/'));
	}

	// Reactive data object with active states
	let data = $derived({
		teams: [
			{
				name: userName ? `${userName} - ${$ownCompany.name || 'SalesSpaice'}` : 'SalesSpaice',
				logo: Command,
				plan: "Enterprise",
			},
		],
		navMain: navMain.map(item => ({
			...item,
			isActive: isActive(item.url)
		})),
		navSecondary: [
			{
				title: "Promptmanager",
				url: "/private/promptmanager",
				icon: Code,
				isActive: isActive("/private/promptmanager")
			},
			{
				title: "Logout",
				url: "#",
				icon: LogOut,
				onClick: handleLogout
			},
		],
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
