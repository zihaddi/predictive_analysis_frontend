<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from '#lib/components/Common/Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		loading?: boolean;
		/** Renders an <a> instead of a <button> (use for navigation). */
		href?: string;
		/** Trailing icon (SVG url), drawn in the button's text colour. */
		trailingIcon?: string;
		children: Snippet;
	}

	let { loading = false, href, trailingIcon, children, disabled, ...rest }: Props = $props();

	const classes =
		'flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[linear-gradient(173.47deg,var(--color-brand-blue)_0%,var(--color-brand-navy)_100%)] px-4 text-sm font-bold text-white transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
</script>

{#snippet content()}
	<span>{@render children()}</span>
	{#if trailingIcon}
		<Icon src={trailingIcon} class="size-6" />
	{/if}
{/snippet}

{#if href}
	<a {href} class={classes}>{@render content()}</a>
{:else}
	<button class={classes} disabled={loading || disabled} {...rest}>{@render content()}</button>
{/if}
