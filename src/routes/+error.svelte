<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { auth } from '#lib/stores/auth.ts';
	import Logo from '#lib/components/Common/Logo.svelte';

	// Known statuses get tailored copy; everything else falls back to a generic message.
	const copy = $derived.by(() => {
		switch (page.status) {
			case 404:
				return { title: m.error_title_404(), description: m.error_desc_404() };
			case 403:
				return { title: m.error_title_403(), description: m.error_desc_403() };
			case 500:
				return { title: m.error_title_500(), description: m.error_desc_500() };
			default:
				return { title: m.error_title_default(), description: m.error_desc_default() };
		}
	});

	// Logged-in users go to the app, guests to the login page.
	const homeHref = $derived(auth.user ? '/dashboard' : '/login');
</script>

<svelte:head>
	<title>{page.status} · {copy.title}</title>
</svelte:head>

<main class="flex min-h-screen flex-col bg-surface">
	<header class="bg-hero px-6 py-6 lg:px-12">
		<div class="h-[38px] w-[190px] lg:h-[50px] lg:w-[253px]">
			<Logo class="origin-top-left scale-75 lg:scale-100" />
		</div>
	</header>

	<div class="flex flex-1 items-center justify-center p-8">
		<div class="w-full max-w-md text-center">
			<p class="text-sm font-semibold tracking-wide text-ink-muted">
				{m.error_code({ status: page.status })}
			</p>
			<h1
				class="mt-2 bg-[linear-gradient(173.47deg,var(--color-brand-cyan)_0%,var(--color-brand-blue)_100%)] bg-clip-text text-8xl font-bold text-transparent sm:text-9xl"
			>
				{page.status}
			</h1>
			<h2 class="mt-4 text-2xl leading-8 font-bold text-heading">{copy.title}</h2>
			<p class="mt-2 text-sm leading-5 text-ink-muted">{copy.description}</p>

			<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
				<a
					href={homeHref}
					class="inline-flex h-11 items-center justify-center rounded-xl bg-[linear-gradient(173.47deg,var(--color-brand-blue)_0%,var(--color-brand-navy)_100%)] px-6 text-sm font-bold text-white transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					{m.error_go_home()}
				</a>
				<button
					type="button"
					onclick={() => history.back()}
					class="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-field-border bg-field px-6 text-sm font-semibold text-ink-label transition hover:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					{m.error_go_back()}
				</button>
			</div>
		</div>
	</div>
</main>
