<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, setLocale } from '#lib/paraglide/runtime.js';
	import chevronIcon from '#lib/assets/icons/chevron-down.svg';
	import globeIcon from '#lib/assets/icons/globe.svg';

	const labels: Record<(typeof locales)[number], string> = {
		en: 'English',
		fr: 'Français',
		es: 'Español'
	};
	const current = getLocale();

	let open = $state(false);
	let root = $state<HTMLElement>();

	function choose(locale: (typeof locales)[number]) {
		open = false;
		if (locale !== current) void setLocale(locale); // writes the cookie and reloads
	}
</script>

<svelte:window
	onclick={(e) => {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') open = false;
	}}
/>

<div class="relative" bind:this={root}>
	<button
		type="button"
		aria-label={m.change_language()}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={() => (open = !open)}
		class="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-toggle-border bg-surface px-3.5 text-sm font-semibold text-toggle-text shadow-lg transition hover:bg-field"
	>
		<img src={globeIcon} alt="" class="size-3.5 dark:invert" />
		<span class="uppercase">{current}</span>
		<img
			src={chevronIcon}
			alt=""
			class="size-3.5 transition-transform dark:invert {open ? 'rotate-180' : ''}"
		/>
	</button>

	{#if open}
		<ul
			role="listbox"
			aria-label={m.change_language()}
			class="absolute right-0 z-10 mt-2 w-36 overflow-hidden rounded-lg border border-toggle-border bg-surface py-1 shadow-lg"
		>
			{#each locales as locale (locale)}
				<li role="option" aria-selected={locale === current}>
					<button
						type="button"
						onclick={() => choose(locale)}
						class="flex w-full cursor-pointer items-center justify-between px-3.5 py-2 text-left text-sm text-toggle-text hover:bg-field {locale ===
						current
							? 'font-semibold'
							: ''}"
					>
						{labels[locale]}
						{#if locale === current}<span aria-hidden="true">✓</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
