<script lang="ts">
	import { enhance } from '$app/forms';
	import chevronRightIcon from '#lib/assets/icons/chevron-right.svg';
	import AuthHeader from '#lib/components/Auth/AuthHeader.svelte';
	import AuthLayout from '#lib/components/Auth/AuthLayout.svelte';
	import AuthMessage from '#lib/components/Auth/AuthMessage.svelte';
	import PasswordInput from '#lib/components/Auth/PasswordInput.svelte';
	import PasswordRequirements from '#lib/components/Auth/PasswordRequirements.svelte';
	import PrimaryButton from '#lib/components/Button/PrimaryButton.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { isPasswordValid } from '#lib/utils/password.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let password = $state('');
	let confirm = $state('');
	let submitted = $state(false);
	let loading = $state(false);

	const weak = $derived(!isPasswordValid(password));
	const mismatch = $derived(password !== confirm);
	// Errors appear after the first submit attempt (client-side or from the server), not while typing.
	const showErrors = $derived(submitted || !!form);
</script>

<svelte:head>
	<title>{m.page_title_create_password()}</title>
</svelte:head>

<AuthLayout>
	<AuthHeader title={m.create_password_title()} class="pb-6">
		{m.create_password_description()}
	</AuthHeader>

	<form
		method="POST"
		class="w-full"
		novalidate
		use:enhance={({ cancel }) => {
			submitted = true;
			// Same checks as the server; skip the round trip when we already know it will fail.
			if (weak || mismatch) {
				cancel();
				return;
			}
			loading = true;
			return async ({ update }) => {
				await update({ reset: false });
				loading = false;
			};
		}}
	>
		<input type="hidden" name="token" value={data.token} />

		<div class="flex flex-col gap-4">
			<PasswordInput
				label={m.new_password()}
				name="password"
				autocomplete="new-password"
				bind:value={password}
				invalid={showErrors && weak}
				aria-describedby="password-rules"
				required
			/>
			<PasswordInput
				label={m.confirm_new_password()}
				name="confirm"
				autocomplete="new-password"
				bind:value={confirm}
				invalid={showErrors && mismatch}
				aria-describedby={showErrors && mismatch ? 'password-mismatch' : undefined}
				required
			/>
		</div>

		{#if form?.serverError}
			<AuthMessage title={m.error_password_rejected()} class="mt-2">
				{form.serverError}
			</AuthMessage>
		{:else if showErrors && mismatch}
			<AuthMessage id="password-mismatch" title={m.error_passwords_mismatch_title()} class="mt-2">
				{m.error_passwords_mismatch_description()}
			</AuthMessage>
		{/if}

		<PasswordRequirements {password} {showErrors} class="pt-4 pb-5" />

		<PrimaryButton type="submit" {loading} trailingIcon={chevronRightIcon}>
			{loading ? m.resetting() : m.reset_password_button()}
		</PrimaryButton>
	</form>
</AuthLayout>
