<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props {
		/** With `href` it renders a link (navigation); without, a button (action). */
		href?: string;
		tone?: 'link' | 'muted';
		class?: string;
		onclick?: HTMLButtonAttributes['onclick'];
		type?: HTMLButtonAttributes['type'];
		children: Snippet;
	}

	let {
		href,
		tone = 'link',
		class: className = '',
		onclick,
		type = 'button',
		children
	}: Props = $props();

	const classes = $derived(
		`-my-2.5 inline-flex cursor-pointer items-center rounded-xs py-2.5 text-sm font-medium underline focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:outline-none ${
			tone === 'link' ? 'text-link' : 'text-ink-label'
		} ${className}`
	);
</script>

{#if href}
	<a {href} class={classes}>{@render children()}</a>
{:else}
	<button {type} {onclick} class={classes}>{@render children()}</button>
{/if}
