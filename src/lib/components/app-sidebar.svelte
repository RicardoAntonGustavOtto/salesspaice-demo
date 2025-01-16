<script lang="ts" module>
	import AudioWaveform from "lucide-svelte/icons/audio-waveform";
	import Blocks from "lucide-svelte/icons/blocks";
	import Calendar from "lucide-svelte/icons/calendar";
	import Command from "lucide-svelte/icons/command";
	import House from "lucide-svelte/icons/house";
	import Inbox from "lucide-svelte/icons/inbox";
	import MessageCircleQuestion from "lucide-svelte/icons/message-circle-question";
	import Search from "lucide-svelte/icons/search";
	import Settings2 from "lucide-svelte/icons/settings-2";
	import Sparkles from "lucide-svelte/icons/sparkles";
	import LogOut from "lucide-svelte/icons/log-out";
	import Trash2 from "lucide-svelte/icons/trash-2";
	import Building2 from "lucide-svelte/icons/building-2";
	// This is sample data.
	const data = {
		teams: [
			{
				name: "SalesSpaice",
				logo: Command,
				plan: "Enterprise",
			},
		],
		navMain: [
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
		],
		navSecondary: [
			{
				title: "Settings",
				url: "#",
				icon: Settings2,
			},
			{
				title: "Research Documents",
				url: "#",
				icon: Blocks,
			},
			{
				title: "Help",
				url: "#",
				icon: MessageCircleQuestion,
			},
			{
				title: "Logout",
				url: "#",
				icon: LogOut,
			},
		],
		favorites: [
			{
				name: "devii",
				url: "#",
				emoji: "📊",
			},
		],
		targetCompanies: [
			{
				name: "devii",
				emoji: "🏠",
				pages: [
					{
						name: "Research Documents",
						url: "#",
						emoji: "📔",
					},
					{
						name: "Prospects",
						url: "#",
						emoji: "🍏",
					},
					{
						name: "Opportunities",
						url: "#",
						emoji: "🌟",
					},
				],
			},
		],
	};
</script>

<script lang="ts">
	import NavFavorites from "$lib/components/nav-favorites.svelte";
	import NavMain from "$lib/components/nav-main.svelte";
	import NavSecondary from "$lib/components/nav-secondary.svelte";
	import NavWorkspaces from "$lib/components/nav-workspaces.svelte";
	import TeamSwitcher from "$lib/components/team-switcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
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
