<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import moonIcon from '#lib/assets/icons/moon.svg';

	// Initial value comes from the server (theme cookie → page.data.theme), so SSR and hydration agree.
	let dark = $state(page.data.theme === 'dark');

	function toggle() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		document.cookie = `theme=${dark ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`;
	}
</script>

<button
	type="button"
	aria-label={m.toggle_dark_mode()}
	aria-pressed={dark}
	onclick={toggle}
	class="grid size-10 cursor-pointer place-items-center rounded-full border border-toggle-border bg-surface transition hover:bg-field"
>
	<img src={moonIcon} alt="" class="size-[15px] dark:invert" />
</button>
