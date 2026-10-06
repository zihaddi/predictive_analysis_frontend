<script lang="ts">
	import AuthLayout from '#lib/components/Auth/AuthLayout.svelte';
	import AuthSuccess from '#lib/components/Auth/AuthSuccess.svelte';
	import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.page_title_password_updated()}</title>
</svelte:head>

<AuthLayout>
	<AuthSuccess
		title={m.password_updated_title()}
		description={m.password_updated_description()}
		actionLabel={m.continue_to_sign_in()}
		actionHref="/login"
	/>
</AuthLayout>
