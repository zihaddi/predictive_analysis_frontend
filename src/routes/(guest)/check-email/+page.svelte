<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthHeader from '#lib/components/Auth/AuthHeader.svelte';
	import AuthLayout from '#lib/components/Auth/AuthLayout.svelte';
	import AuthLink from '#lib/components/Auth/AuthLink.svelte';
	import SupportContact from '#lib/components/Auth/SupportContact.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.page_title_check_email()}</title>
</svelte:head>

<AuthLayout>
	<AuthHeader title={m.check_email_title()} icon="mail" class="pb-8">
		{m.check_email_sent_prefix()}<strong class="font-bold text-heading">{data.email}</strong
		>{m.check_email_sent_suffix({ minutes: 15 })}
	</AuthHeader>

	<div class="flex flex-col items-center gap-3 rounded-xl border border-card-border bg-field p-5">
		<p class="text-center text-[13px] leading-[18px] text-ink-slate">
			{m.check_email_not_received()}
		</p>
		<form method="POST" action="?/resend" use:enhance>
			<AuthLink type="submit" class="font-semibold">{m.check_email_resend()}</AuthLink>
		</form>
		<p
			role="status"
			class="text-center text-xs empty:hidden {form?.resendError ? 'text-danger' : 'text-success'}"
		>
			{form?.resendError ?? (form?.resent ? m.check_email_resent() : '')}
		</p>
	</div>

	<div class="flex flex-col items-center pt-8">
		<AuthLink href="/login" tone="muted">{m.back_to_sign_in()}</AuthLink>
	</div>

	<SupportContact class="pt-8" />
</AuthLayout>
