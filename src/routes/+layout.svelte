<slot></slot>

<style lang="scss">
	:root {
		//
		// Colors base
		//
		--c--blue--20: hsl(207, 65%, 20%);
		--c--blue--35: hsl(207, 45%, 35%);
		--c--blue--96: hsl(207, 100%, 96%);

		--c--white--100: hsl(0, 0%, 100%);

		//
		// Colors semantic
		//
		--c--main--background: var(--c--blue--96);
		--c--main--text: var(--c--blue--20);

		--c--booking--background: var(--c--blue--35);
		--c--booking--text: var(--c--white--100);

		--c--grid--line: hsl(from var(--c--main--text) h s l / 15%);

		//
		// Shadows
		//
		--box-shadow--booking: 0.5px 1px 1px hsl(220deg 60% 50% / 0.7);

		//
		// Other
		//
		--border-radius--100: 10px;

		--grid-columns: 4em 1fr 1fr;

		@media (prefers-color-scheme: dark) {
			--c--main--background: var(--c--blue--20);
			--c--main--text: var(--c--blue--96);

			--c--booking--background: var(--c--blue--35);
			--c--booking--text: var(--c--white--100);
		}

		@media screen and (max-width: 355px) {
			font-size: 14px;
		}

		@media screen and (min-width: 700px) {
			font-size: 20px;
		}
	}

	:global(*, *::after, *::before) {
		box-sizing: border-box;
	}

	:global(body) {
		background-color: var(--c--main--background);
		color: var(--c--main--text);

		font-family: 'Montserrat', sans-serif;
		font-optical-sizing: auto;
		font-weight: 400;
		font-style: normal;

		margin: 0;
	}
</style>
