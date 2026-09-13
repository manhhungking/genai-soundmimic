import { WorkflowLayout } from '@genai-fi/base';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import i18n, { i18nReady } from '../../i18n';
import TrainingStage, { type TrainingStatus } from './TrainingStage';

function renderStage(status: TrainingStatus, canTrain = true) {
    return render(
        <WorkflowLayout connections={[]} columns={1}>
            <TrainingStage canTrain={canTrain} status={status} onTrain={vi.fn()} />
        </WorkflowLayout>,
    );
}

describe('TrainingStage', () => {
    beforeAll(async () => {
        await i18nReady;
        await i18n.changeLanguage('en-GB');
    });

    it('shows the Teachable Machine waiting treatment while training', () => {
        const { container } = renderStage('loading');
        const button = screen.getByRole('button', { name: 'Train Classifier' });

        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(button.querySelector('.train-classifier-button__spinner')).toBeInTheDocument();
        expect(screen.getByRole('progressbar', { name: 'Training…' })).toBeInTheDocument();
        expect(container.querySelector('.training-stage__status')).not.toBeInTheDocument();
    });

    it('shows a success alert and a plain train-again button when complete', () => {
        renderStage('done');
        const button = screen.getByRole('button', { name: 'Train again' });

        expect(button).toBeEnabled();
        expect(button.querySelector('svg')).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Training complete');
    });

    it('keeps the untrainable note and button free of action icons', () => {
        renderStage('ready', false);
        const button = screen.getByRole('button', { name: 'Train Classifier' });

        expect(button).toBeDisabled();
        expect(button.querySelector('svg')).not.toBeInTheDocument();
        expect(screen.getByText('Add more samples to help your model learn.')).toBeInTheDocument();
    });
});
