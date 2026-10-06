<script lang="ts">
	import checkIcon from '#lib/assets/icons/check.svg';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'type'> {
		label: string;
		name: string;
	}

	let { label, name, checked = $bindable(false), ...rest }: Props = $props();
</script>

<label class="inline-flex cursor-pointer items-center gap-2 text-xs text-ink-label">
	<span class="relative inline-flex size-3 shrink-0">
		<input
			type="checkbox"
			{name}
			bind:checked
			class="peer size-3 cursor-pointer appearance-none rounded-xs border border-checkbox-border bg-surface checked:border-checkbox checked:bg-checkbox focus-visible:ring-2 focus-visible:ring-checkbox focus-visible:ring-offset-1 focus-visible:outline-none"
			{...rest}
		/>
		<img
			src={checkIcon}
			alt=""
			class="pointer-events-none absolute inset-0 m-auto size-2.5 opacity-0 peer-checked:opacity-100"
		/>
	</span>
	{label}
</label>
