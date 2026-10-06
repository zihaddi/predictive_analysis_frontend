<script lang="ts">
	import AuthHeader from '#lib/components/Auth/AuthHeader.svelte';
	import AuthLayout from '#lib/components/Auth/AuthLayout.svelte';
	import LoginForm from '#lib/components/Auth/LoginForm.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.page_title_sign_in()}</title>
</svelte:head>

<AuthLayout>
	<AuthHeader title={m.welcome_back()} class="pb-8">
		{m.sign_in_subtitle()}
	</AuthHeader>

	<LoginForm error={form?.error} />

	<p class="pt-8 text-center text-xs leading-4 text-ink-faint">
		{m.having_trouble()}
		<a href="mailto:support@impulselogic.com" class="text-link hover:underline"
			>support@impulselogic.com</a
		>
	</p>
</AuthLayout>
