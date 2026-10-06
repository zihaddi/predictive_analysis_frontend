<script lang="ts">
	import type { Snippet } from 'svelte';
	import checkIcon from '#lib/assets/icons/check-success.svg';
	import mailIcon from '#lib/assets/icons/mail.svg';
	import Icon from '#lib/components/Common/Icon.svelte';

	interface Props {
		title: string;
		/** With an icon the header is centered inside a round badge; without, it is left-aligned. */
		icon?: 'mail' | 'success';
		class?: string;
		/** Supporting description. */
		children?: Snippet;
	}

	let { title, icon, class: className = '', children }: Props = $props();
</script>

{#if icon}
	<header class="flex flex-col items-center gap-4 text-center {className}">
		<div
			class="grid size-12 place-items-center rounded-full {icon === 'success'
				? 'bg-success-bg text-success'
				: 'bg-badge-bg text-heading'}"
		>
			<Icon src={icon === 'success' ? checkIcon : mailIcon} class="size-6" />
		</div>
		<h1 class="w-full text-2xl leading-8 font-bold text-heading">{title}</h1>
		{#if children}
			<p class="w-full text-sm leading-[22px] text-ink-muted">{@render children()}</p>
		{/if}
	</header>
{:else}
	<header class={className}>
		<h1 class="text-2xl leading-8 font-bold text-heading">{title}</h1>
		{#if children}
			<p class="pt-1 text-sm leading-5 text-ink-muted">{@render children()}</p>
		{/if}
	</header>
{/if}
