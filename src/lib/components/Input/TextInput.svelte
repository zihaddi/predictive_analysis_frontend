<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import alertCircleIcon from '#lib/assets/icons/alert-circle.svg';
	import Icon from '#lib/components/Common/Icon.svelte';

	export interface TextInputProps extends HTMLInputAttributes {
		label: string;
		name: string;
		/** Message shown under the field (also marks it invalid). */
		error?: string;
		/** Mark invalid without a message (e.g. when a banner explains it). */
		invalid?: boolean;
		/** Leading icon (SVG url). */
		icon?: string;
		/** Content rendered inside the field, after the input (e.g. a show/hide button). */
		trailing?: Snippet;
		value?: string;
	}

	let {
		label,
		name,
		error,
		invalid = false,
		icon,
		trailing,
		value = $bindable(''),
		class: className = '',
		...rest
	}: TextInputProps = $props();

	const hasError = $derived(invalid || !!error);
	const errorId = $derived(`${name}-error`);
</script>

<div class={className}>
	<label for={name} class="block pb-1.5 text-xs font-semibold text-ink-label">{label}</label>
	<div
		class="flex items-center gap-2 rounded-xl border px-4 transition-colors focus-within:ring-1 {hasError
			? 'border-danger-border bg-danger-bg focus-within:ring-danger-border'
			: 'border-field-border bg-field focus-within:border-brand-blue focus-within:ring-brand-blue'}"
	>
		{#if icon}
			<Icon src={icon} class="size-6 text-heading" />
		{/if}
		<input
			id={name}
			{name}
			bind:value
			aria-invalid={hasError ? true : undefined}
			aria-describedby={error ? errorId : undefined}
			class="min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-sm placeholder:text-ink-faint focus:ring-0 focus:outline-none {hasError
				? 'text-danger-ink'
				: 'text-heading'}"
			{...rest}
		/>
		{@render trailing?.()}
	</div>
	<div aria-live="polite">
		{#if error}
			<p id={errorId} class="flex items-center gap-1.5 pt-2 text-[13px] leading-4 text-danger">
				<Icon src={alertCircleIcon} class="size-6 text-heading" />
				<span class="min-w-0 flex-1">{error}</span>
			</p>
		{/if}
	</div>
</div>
