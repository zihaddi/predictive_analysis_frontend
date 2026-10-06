<script lang="ts">
	// Renders an SVG as a CSS mask so it takes the surrounding text colour (`text-*`),
	// which lets one asset work in light mode, dark mode and on coloured buttons.
	// The mask URL is dynamic per icon, which is why this is one of the few inline styles.
	let { src, class: className = '' }: { src: string; class?: string } = $props();
</script>

<span
	aria-hidden="true"
	class="inline-block shrink-0 bg-current {className}"
	style:mask={`url("${src}") center / contain no-repeat`}
	style:-webkit-mask={`url("${src}") center / contain no-repeat`}
></span>
