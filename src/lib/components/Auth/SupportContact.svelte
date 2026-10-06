<script lang="ts">
	import { SUPPORT_EMAIL } from '#lib/config.ts';
	import { m } from '#lib/paraglide/messages.js';

	let { class: className = '' }: { class?: string } = $props();

	// Opens the user's default mail app with a localized, pre-filled subject and body.
	const mailto = $derived(
		`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(m.support_subject())}&body=${encodeURIComponent(m.support_body())}`
	);
</script>

<p class="text-center text-xs leading-4 text-ink-faint {className}">
	{m.having_trouble()}
	<a
		href={mailto}
		class="rounded-xs text-link hover:underline focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
	>
		{SUPPORT_EMAIL}
	</a>
</p>
