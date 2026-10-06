<script lang="ts">
	import { page } from '$app/state';

	// Register new business modules here (and document them in CLAUDE.md).
	const items = [{ href: '/dashboard', label: 'Dashboard' }];
</script>

<aside class="hidden w-60 shrink-0 border-r border-toggle-border bg-surface p-4 md:block">
	<div class="mb-6 px-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">
		Predictive Analysis
	</div>
	<nav class="space-y-1">
		{#each items as item (item.href)}
			<a
				href={item.href}
				class="block rounded-lg px-3 py-2 text-sm font-medium {page.url.pathname === item.href
					? 'bg-indigo-50 text-indigo-700 dark:bg-white/10 dark:text-indigo-300'
					: 'text-ink-label hover:bg-field'}"
			>
				{item.label}
			</a>
		{/each}
	</nav>
</aside>
