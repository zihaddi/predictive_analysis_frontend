<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<!-- Guest layout: full-bleed, pages own their composition (e.g. split login). -->
<div class="min-h-screen bg-surface">
	{@render children()}
</div>
