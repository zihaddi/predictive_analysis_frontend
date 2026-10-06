<script lang="ts">
	// Placeholder data. Replace with real values loaded in +page.server.ts.
	const stats = [
		{ label: 'Total Records', value: '1,248' },
		{ label: 'Models Trained', value: '12' },
		{ label: 'Predictions Today', value: '312' },
		{ label: 'Avg. Accuracy', value: '94.2%' }
	];
</script>

<svelte:head>
	<title>Dashboard · Predictive Analysis</title>
</svelte:head>

<h1 class="text-2xl font-bold text-heading">Dashboard</h1>

<div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<div class="rounded-xl bg-surface p-5 shadow-sm ring-1 ring-toggle-border">
			<p class="text-sm text-ink-muted">{stat.label}</p>
			<p class="mt-2 text-2xl font-semibold text-heading">{stat.value}</p>
		</div>
	{/each}
</div>

<div class="mt-6 rounded-xl bg-surface p-5 shadow-sm ring-1 ring-toggle-border">
	<h2 class="text-base font-semibold text-heading">Recent activity</h2>
	<p class="mt-2 text-sm text-ink-muted">Nothing here yet.</p>
</div>
