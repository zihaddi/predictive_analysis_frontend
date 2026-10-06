<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import logoMark from '#lib/assets/login/logo-mark.png';
	import logoLogicWhite from '#lib/assets/login/logo-logic-white.png';

	let { class: className = '' }: { class?: string } = $props();
</script>

<!-- Impulse Logic · LightTouch Analytics lockup (white variant), 253×50 -->
<div class="relative h-[50px] w-[253px] shrink-0 {className}" role="img" aria-label={m.logo_alt()}>
	<!-- arrow mark -->
	<div class="pointer-events-none absolute top-0 left-0 h-[50px] w-[75px] overflow-hidden">
		<img src={logoMark} alt="" class="absolute top-[-0.8%] left-0 h-full w-[336.69%] max-w-none" />
	</div>

	<!-- wordmark -->
	<div class="pointer-events-none absolute top-[3px] left-[75px] h-8 w-[178px]">
		<div class="absolute top-[-9px] left-0 h-[50px] w-[178px] overflow-hidden">
			<img
				src={logoMark}
				alt=""
				class="absolute top-[-0.8%] left-[-42.13%] h-full w-[141.87%] max-w-none"
			/>
		</div>
		<div class="absolute top-[-9px] left-[112px] h-[50px] w-[66px]">
			<img
				src={logoLogicWhite}
				alt=""
				class="absolute inset-0 size-full max-w-none object-bottom"
			/>
		</div>
	</div>

	<!-- tagline -->
	<p
		class="absolute top-[37px] left-[79px] w-[178px] text-[10px] leading-[13.5px] tracking-[2.9px] whitespace-nowrap text-white/80"
	>
		LIGHTTOUCH ANALYTICS
	</p>
</div>
