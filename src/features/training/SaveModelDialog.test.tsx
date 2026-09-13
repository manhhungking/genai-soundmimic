import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n, { i18nReady } from '../../i18n';
import SaveModelDialog from './SaveModelDialog';

describe('SaveModelDialog', () => {
    beforeEach(async () => {
        await i18nReady;
        await i18n.changeLanguage('en-GB');
    });

    it('submits the chosen model name and optional contents', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        const onSave = vi.fn(async () => undefined);
        render(
            <SaveModelDialog
                canSave
                onClose={onClose}
                onSave={onSave}
                open
            />,
        );

        const dialog = screen.getByRole('dialog', { name: 'Save Classifier' });
        const nameInput = within(dialog).getByRole('textbox', { name: 'Name' });
        await user.clear(nameInput);
        await user.type(nameInput, 'Bird Lab');
        await user.click(within(dialog).getByRole('checkbox', { name: 'Save Samples' }));
        await user.click(within(dialog).getByRole('checkbox', { name: 'Save Behaviors' }));
        await user.click(within(dialog).getByRole('button', { name: 'Save' }));

        expect(onSave).toHaveBeenCalledWith({
            includeBehaviours: false,
            includeSamples: false,
            name: 'Bird Lab',
        });
        expect(onClose).toHaveBeenCalledOnce();
    });
});
