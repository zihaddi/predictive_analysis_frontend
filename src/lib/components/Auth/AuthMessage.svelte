<script lang="ts">
	import type { Snippet } from 'svelte';
	import shieldAlertIcon from '#lib/assets/icons/shield-alert.svg';
	import Icon from '#lib/components/Common/Icon.svelte';

	interface Props {
		title: string;
		id?: string;
		class?: string;
		/** Optional detail line under the title. */
		children?: Snippet;
	}

	let { title, id, class: className = '', children }: Props = $props();
</script>

<!-- Prominent error banner. role="alert" so assistive tech announces it when it appears. -->
<div
	{id}
	role="alert"
	class="flex items-start gap-2.5 rounded-lg border border-banner-border bg-banner-bg px-3 py-3 text-danger-ink {className}"
>
	<Icon src={shieldAlertIcon} class="size-6 text-heading" />
	<div class="min-w-0 flex-1">
		<p class="text-[13px] font-bold">{title}</p>
		{#if children}
			<p class="text-xs">{@render children()}</p>
		{/if}
	</div>
</div>
