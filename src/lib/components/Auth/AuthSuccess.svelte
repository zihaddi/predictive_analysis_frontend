<script lang="ts">
	import chevronRightIcon from '#lib/assets/icons/chevron-right.svg';
	import AuthHeader from '#lib/components/Auth/AuthHeader.svelte';
	import PrimaryButton from '#lib/components/Button/PrimaryButton.svelte';

	let {
		title,
		description,
		actionLabel,
		actionHref
	}: { title: string; description: string; actionLabel: string; actionHref: string } = $props();
</script>

<!-- Reusable "it worked" state: success badge, message and one primary action. -->
<AuthHeader {title} icon="success" class="pb-8">
	{description}
</AuthHeader>
<PrimaryButton href={actionHref} trailingIcon={chevronRightIcon}>{actionLabel}</PrimaryButton>
