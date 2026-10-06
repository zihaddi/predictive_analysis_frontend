<script lang="ts">
	import { enhance } from '$app/forms';
	import chevronRightIcon from '#lib/assets/icons/chevron-right.svg';
	import mailIcon from '#lib/assets/icons/mail.svg';
	import AuthHeader from '#lib/components/Auth/AuthHeader.svelte';
	import AuthLayout from '#lib/components/Auth/AuthLayout.svelte';
	import AuthLink from '#lib/components/Auth/AuthLink.svelte';
	import AuthMessage from '#lib/components/Auth/AuthMessage.svelte';
	import SupportContact from '#lib/components/Auth/SupportContact.svelte';
	import PrimaryButton from '#lib/components/Button/PrimaryButton.svelte';
	import TextInput from '#lib/components/Input/TextInput.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>{m.page_title_reset_password()}</title>
</svelte:head>

<AuthLayout>
	<AuthHeader title={m.reset_password_title()} class="pb-8">
		{m.reset_password_description()}
	</AuthHeader>

	{#if data.expired}
		<AuthMessage title={m.reset_link_expired_title()} class="mb-6">
			{m.reset_link_expired_description()}
		</AuthMessage>
	{/if}

	<form
		method="POST"
		class="w-full"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update({ reset: false });
				loading = false;
			};
		}}
	>
		<TextInput
			label={m.email_address()}
			name="email"
			type="email"
			autocomplete="email"
			placeholder={m.email_placeholder()}
			icon={mailIcon}
			value={form?.email ?? ''}
			error={form?.error}
			required
		/>

		<div class="flex flex-col gap-3 pt-6">
			<PrimaryButton type="submit" {loading} trailingIcon={chevronRightIcon}>
				{loading ? m.sending() : form?.error ? m.retry_sending_link() : m.send_reset_link()}
			</PrimaryButton>
			<div class="flex justify-center pt-3">
				<AuthLink href="/login">{m.back_to_sign_in()}</AuthLink>
			</div>
		</div>
	</form>

	<SupportContact class="pt-8" />
</AuthLayout>
