<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import arrows from '#lib/assets/login/arrows.png';
	import heroBg from '#lib/assets/login/hero-bg.webp';
	import Logo from '#lib/components/Common/Logo.svelte';

	const stats = [
		{ value: '95%+', label: m.stat_osa_accuracy },
		{ value: '$2.4M', label: m.stat_lost_sales },
		{ value: '13,931', label: m.stat_stores }
	];
</script>

<section class="relative hidden min-h-screen flex-col overflow-hidden bg-hero p-12 lg:flex">
	<img src={heroBg} alt="" class="absolute inset-0 size-full object-cover" />
	<img
		src={arrows}
		alt=""
		class="pointer-events-none absolute -bottom-[199px] left-[41%] h-[398px] w-[600px] max-w-none opacity-17"
	/>

	<div class="relative -mt-1">
		<Logo />
	</div>

	<div class="relative my-auto -translate-y-1.5">
		<h2 class="text-3xl leading-snug font-bold text-white xl:text-4xl xl:leading-[49.5px]">
			{m.hero_headline_1()}<br />
			<span class="text-brand-cyan">{m.hero_headline_2()}</span>
		</h2>
		<p class="mt-4 max-w-4xl text-base leading-[27.2px] text-white/60">
			{m.hero_paragraph()}
		</p>

		<dl class="mt-8 grid grid-cols-3 gap-4">
			{#each stats as stat (stat.value)}
				<div class="rounded-xl border border-white/10 bg-white/6 p-4">
					<dt class="sr-only">{stat.label()}</dt>
					<dd class="text-2xl leading-8 font-bold text-brand-cyan">{stat.value}</dd>
					<dd class="pt-1 text-xs leading-4 text-white/50" aria-hidden="true">{stat.label()}</dd>
				</div>
			{/each}
		</dl>
	</div>

	<p class="relative text-xs leading-4 text-white">
		{m.hero_footer()}
	</p>
</section>
