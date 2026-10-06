<script lang="ts">
	import AuthHeader from '#lib/components/Auth/AuthHeader.svelte';
	import AuthLayout from '#lib/components/Auth/AuthLayout.svelte';
	import LoginForm from '#lib/components/Auth/LoginForm.svelte';
	import SupportContact from '#lib/components/Auth/SupportContact.svelte';
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

	<SupportContact class="pt-8" />
</AuthLayout>
