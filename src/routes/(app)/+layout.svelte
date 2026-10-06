<script lang="ts">
	import { enhance } from '$app/forms';
	import Sidebar from '#lib/components/Sidebar/Sidebar.svelte';
	import { auth } from '#lib/stores/auth.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<!-- Authenticated app shell: sidebar + header + content. -->
<div class="flex min-h-screen bg-field">
	<Sidebar />

	<div class="flex min-w-0 flex-1 flex-col">
		<header
			class="flex items-center justify-between border-b border-toggle-border bg-surface px-6 py-3"
		>
			<span class="text-sm text-ink-muted">Hello, {auth.user?.name}</span>
			<form method="POST" action="/api/auth/logout" use:enhance>
				<button class="text-sm font-medium text-ink-label hover:text-heading">Logout</button>
			</form>
		</header>

		<main class="flex-1 p-6">
			{@render children()}
		</main>
	</div>
</div>
