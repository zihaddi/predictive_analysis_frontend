<script lang="ts">
	import logoMark from '#lib/assets/login/logo-mark.png';
	import { m } from '#lib/paraglide/messages.js';

	let { class: className = '' }: { class?: string } = $props();
</script>

<!--
	Impulse Logic · LightTouch Analytics lockup (white variant), 253×50.
	One sprite, two clipped copies split between "impulse" and "logic" (x = 187px):
	the right copy has its navy lettering turned into solid white, so "logic" is crisp and fully opaque.
-->
<div class="relative h-[50px] w-[253px] shrink-0 {className}" role="img" aria-label={m.logo_alt()}>
	<!-- arrow mark + "impulse" -->
	<div class="pointer-events-none absolute inset-y-0 left-0 w-[187px] overflow-hidden">
		<img src={logoMark} alt="" class="absolute top-[-0.8%] left-0 h-full w-[253px] max-w-none" />
	</div>

	<!-- "logic" -->
	<div class="pointer-events-none absolute inset-y-0 right-0 left-[187px] overflow-hidden">
		<img
			src={logoMark}
			alt=""
			class="absolute top-[-0.8%] -left-[187px] h-full w-[253px] max-w-none brightness-0 invert"
		/>
	</div>

	<!-- tagline -->
	<p
		class="absolute top-[37px] left-[79px] w-[178px] text-[10px] leading-[13.5px] tracking-[2.9px] whitespace-nowrap text-white/80"
	>
		LIGHTTOUCH ANALYTICS
	</p>
</div>
