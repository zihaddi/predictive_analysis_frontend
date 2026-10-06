<script lang="ts">
	import alertTriangleIcon from '#lib/assets/icons/alert-triangle.svg';
	import checkIcon from '#lib/assets/icons/check-green.svg';
	import Icon from '#lib/components/Common/Icon.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { evaluatePassword, type PasswordRuleId } from '#lib/utils/password.ts';

	interface Props {
		password: string;
		/** After a submit attempt, unmet rules switch from neutral to an error state. */
		showErrors?: boolean;
		id?: string;
		class?: string;
	}

	let {
		password,
		showErrors = false,
		id = 'password-rules',
		class: className = ''
	}: Props = $props();

	const labels: Record<PasswordRuleId, () => string> = {
		length: m.req_length,
		special: m.req_special,
		number: m.req_number
	};

	const items = $derived(
		evaluatePassword(password).map((rule) => ({
			...rule,
			state: rule.met ? 'met' : showErrors ? 'failed' : 'pending'
		}))
	);
</script>

<section aria-labelledby="{id}-title" class="flex flex-col gap-2 {className}">
	<h2 id="{id}-title" class="text-xs leading-4 font-bold tracking-[0.5px] text-ink-slate uppercase">
		{m.password_requirements()}
	</h2>
	<ul {id} class="flex flex-col gap-2">
		{#each items as item (item.id)}
			<li
				class="flex items-center gap-2 text-[13px] {item.state === 'met'
					? 'text-success'
					: item.state === 'failed'
						? 'text-danger-border'
						: 'text-ink-muted'}"
			>
				<!-- Icon shape differs per state, so status never relies on colour alone -->
				<span class="grid size-4 shrink-0 place-items-center">
					{#if item.state === 'met'}
						<Icon src={checkIcon} class="size-3" />
					{:else if item.state === 'failed'}
						<Icon src={alertTriangleIcon} class="size-4 text-heading" />
					{:else}
						<span class="size-2.5 rounded-full border border-current"></span>
					{/if}
				</span>
				<span>{labels[item.id]()}</span>
				<span class="sr-only" aria-live="polite">
					{item.met ? m.req_status_met() : m.req_status_unmet()}
				</span>
			</li>
		{/each}
	</ul>
</section>
