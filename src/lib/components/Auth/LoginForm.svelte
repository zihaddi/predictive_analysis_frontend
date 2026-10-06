<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import PrimaryButton from '#lib/components/Button/PrimaryButton.svelte';
	import Checkbox from '#lib/components/Input/Checkbox.svelte';
	import TextInput from '#lib/components/Input/TextInput.svelte';

	let { error }: { error?: string } = $props();
	let loading = $state(false);
</script>

<form
	method="POST"
	class="w-full"
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			await update();
			loading = false;
		};
	}}
>
	<div class="space-y-4">
		<TextInput
			label={m.email_address()}
			name="email"
			type="email"
			autocomplete="email"
			placeholder={m.email_placeholder()}
			required
		/>
		<TextInput
			label={m.password()}
			name="password"
			type="password"
			autocomplete="current-password"
			required
		/>
	</div>

	<div class="flex h-12 items-center justify-between py-4">
		<Checkbox name="remember" label={m.remember_me()} checked />
		<a href="/forgot-password" class="text-xs text-brand-cyan hover:underline"
			>{m.forgot_password()}</a
		>
	</div>

	{#if error}
		<p role="alert" class="mb-3 text-sm text-red-600">{error}</p>
	{/if}

	<PrimaryButton type="submit" {loading}>
		{loading ? m.signing_in() : m.sign_in()}
	</PrimaryButton>
</form>
