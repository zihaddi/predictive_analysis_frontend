<script lang="ts">
	import logoMark from '#lib/assets/login/logo-mark.png';
	import { m } from '#lib/paraglide/messages.js';

	let { class: className = '' }: { class?: string } = $props();
</script>

<!--
	Impulse Logic · LightTouch Analytics lockup (white variant), 253×50 — Figma node 13:439.
	The artwork is one 500×99 raster used in layers, exactly as in the design:
	  1. arrow mark      → box x 0–75, y 0
	  2. wordmark        → box x 75–253, shifted 6px UP so the text clears the tagline
	     "impulse" stays cyan; "logic" (x ≥ 112 inside the box) is the sprite's own navy lettering turned into
	     opaque white (the design overlays a semi-transparent raster instead, which reads grey and soft).
	  3. tagline         → live text
-->
<div class="relative h-12.5 w-63.25 shrink-0 {className}" role="img" aria-label={m.logo_alt()}>
	<!-- 1. arrow mark -->
	<div class="pointer-events-none absolute top-0 left-0 h-12.5 w-18.75 overflow-hidden">
		<img src={logoMark} alt="" class="absolute top-[-0.8%] left-0 h-full w-[336.69%] max-w-none" />
	</div>

	<!-- 2. wordmark -->
	<div class="pointer-events-none absolute -top-1.5 left-18.75 h-12.5 w-44.5 overflow-hidden">
		<!-- "impulse" -->
		<div class="absolute inset-y-0 left-0 w-28 overflow-hidden">
			<img
				src={logoMark}
				alt=""
				class="absolute top-[-0.8%] -left-18.75 h-full w-[252.5px] max-w-none"
			/>
		</div>
		<!-- "logic" -->
		<div class="absolute inset-y-0 right-0 left-28 overflow-hidden">
			<img
				src={logoMark}
				alt=""
				class="absolute top-[-0.8%] -left-46.75 h-full w-[252.5px] max-w-none brightness-0 invert"
			/>
		</div>
	</div>

	<!-- 3. tagline -->
	<p
		class="absolute top-9.25 left-19.75 w-44.5 text-[10px] leading-[13.5px] tracking-[2.9px] whitespace-nowrap text-white/80"
	>
		LIGHTTOUCH ANALYTICS
	</p>
</div>
