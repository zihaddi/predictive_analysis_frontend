<script lang="ts">
	import type { Snippet } from 'svelte';
	import AuthHero from '#lib/components/Auth/AuthHero.svelte';
	import LanguageToggle from '#lib/components/Common/LanguageToggle.svelte';
	import Logo from '#lib/components/Common/Logo.svelte';
	import ThemeToggle from '#lib/components/Common/ThemeToggle.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- Shared shell for every authentication screen: brand panel + toggles + centered form column. -->
<div class="grid min-h-screen lg:grid-cols-2">
	<AuthHero />

	<main class="relative flex min-h-screen flex-col bg-surface lg:justify-center">
		<!-- Brand bar, shown only when the hero panel is hidden -->
		<div class="bg-hero px-6 py-6 lg:hidden">
			<div class="h-[38px] w-[190px]">
				<Logo class="origin-top-left scale-75" />
			</div>
		</div>

		<div class="absolute top-6 right-4 flex items-center gap-3 lg:top-10.5 lg:right-14">
			<LanguageToggle />
			<ThemeToggle />
		</div>

		<div class="flex flex-1 items-center justify-center p-8 lg:flex-none">
			<div class="w-full max-w-sm">
				{@render children()}
			</div>
		</div>
	</main>
</div>
