<script lang="ts">
	import TextInput, { type TextInputProps } from '#lib/components/Input/TextInput.svelte';
	import { m } from '#lib/paraglide/messages.js';

	let { value = $bindable(''), ...rest }: Omit<TextInputProps, 'type' | 'trailing' | 'icon'> =
		$props();

	let visible = $state(false);
</script>

<TextInput {...rest} bind:value type={visible ? 'text' : 'password'}>
	{#snippet trailing()}
		<button
			type="button"
			aria-label={visible ? m.hide_password() : m.show_password()}
			aria-pressed={visible}
			onclick={() => (visible = !visible)}
			class="-mr-2 grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-ink-muted transition hover:text-heading focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-5"
				aria-hidden="true"
			>
				{#if visible}
					<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
					<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
					<path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
					<line x1="2" x2="22" y1="2" y2="22" />
				{:else}
					<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
					<circle cx="12" cy="12" r="3" />
				{/if}
			</svg>
		</button>
	{/snippet}
</TextInput>
