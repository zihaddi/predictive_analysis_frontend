<script lang="ts">
	import { adminApi } from '#lib/api/admin.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { describeError } from '#lib/utils/apiError.ts';
	import { useRequest } from '#lib/utils/useRequest.svelte.ts';

	const PAGE_SIZE = 10;

	// Nuxt-style request state: isLoading / data / error + execute() (≈ loadData).
	const users = useRequest((page: number) => adminApi.listUsers({ page, pageSize: PAGE_SIZE }));

	let page = $state(1);
	const pages = $derived(users.data ? Math.max(Math.ceil(users.data.total / PAGE_SIZE), 1) : 1);

	$effect(() => {
		void users.execute(page);
	});
</script>

<section class="mt-6 rounded-xl bg-surface p-5 shadow-sm ring-1 ring-toggle-border">
	<h2 class="text-base font-semibold text-heading">{m.users_title()}</h2>

	{#if users.error}
		<div role="alert" class="mt-3 flex items-center gap-3 text-sm text-danger">
			<span>{m.users_load_error()} {describeError(users.error)}</span>
			<button
				type="button"
				onclick={() => users.execute(page)}
				class="cursor-pointer font-semibold underline"
			>
				{m.users_retry()}
			</button>
		</div>
	{:else if users.data === null}
		<p class="mt-3 text-sm text-ink-muted" aria-live="polite">{m.users_loading()}</p>
	{:else if users.data.items.length === 0}
		<p class="mt-3 text-sm text-ink-muted">{m.users_empty()}</p>
	{:else}
		<div class="mt-3 overflow-x-auto" class:opacity-60={users.isLoading}>
			<table class="w-full min-w-[32rem] text-left text-sm">
				<thead class="text-xs text-ink-muted uppercase">
					<tr>
						<th scope="col" class="py-2 pr-4 font-semibold">{m.users_col_name()}</th>
						<th scope="col" class="py-2 pr-4 font-semibold">{m.users_col_email()}</th>
						<th scope="col" class="py-2 pr-4 font-semibold">{m.users_col_role()}</th>
						<th scope="col" class="py-2 font-semibold">{m.users_col_status()}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-toggle-border">
					{#each users.data.items as user (user.id)}
						<tr>
							<td class="py-2.5 pr-4 font-medium text-heading">{user.name}</td>
							<td class="py-2.5 pr-4 text-ink-label">{user.email}</td>
							<td class="py-2.5 pr-4 text-ink-label">{user.role}</td>
							<td class="py-2.5">
								<span
									class="rounded-full px-2 py-0.5 text-xs font-semibold {user.is_active
										? 'bg-success-bg text-success'
										: 'bg-badge-bg text-ink-muted'}"
								>
									{user.is_active ? m.users_status_active() : m.users_status_inactive()}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-4 flex items-center justify-between gap-3 text-sm text-ink-muted">
			<span>{m.pagination_summary({ page, pages, total: users.data.total })}</span>
			<div class="flex gap-2">
				<button
					type="button"
					disabled={page <= 1 || users.isLoading}
					onclick={() => (page -= 1)}
					class="h-9 cursor-pointer rounded-lg border border-field-border bg-field px-3 font-medium text-ink-label hover:border-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
				>
					{m.pagination_previous()}
				</button>
				<button
					type="button"
					disabled={page >= pages || users.isLoading}
					onclick={() => (page += 1)}
					class="h-9 cursor-pointer rounded-lg border border-field-border bg-field px-3 font-medium text-ink-label hover:border-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
				>
					{m.pagination_next()}
				</button>
			</div>
		</div>
	{/if}
</section>
