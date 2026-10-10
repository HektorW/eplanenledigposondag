import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FieldChips, { type FieldChip } from './FieldChips.svelte';

const chips: FieldChip[] = [
	{ id: 'one', name: 'Ett', query: '?date=2026-10-11' },
	{ id: 'two', name: 'Två', query: '?date=2026-10-11&field=two' },
	{ id: 'three', name: 'Tre', query: '?date=2026-10-11&field=three' },
	{ id: 'four', name: 'Fyra', query: '?date=2026-10-11&field=four' }
];

describe('FieldChips', () => {
	it('renders one link per field, marking the selected one', async () => {
		const screen = render(FieldChips, { chips, selectedId: 'two' });

		for (const chip of chips) {
			const link = screen.getByTestId(`field-chip-${chip.id}`);
			await expect.element(link).toHaveTextContent(chip.name);
			await expect.element(link).toHaveAttribute('href', `/${chip.query}`);
		}

		await expect
			.element(screen.getByTestId('field-chip-two'))
			.toHaveAttribute('aria-current', 'page');
		await expect.element(screen.getByTestId('field-chip-one')).not.toHaveAttribute('aria-current');
	});
});
