import { WorkflowLayout } from '@genai-fi/base';
import type { AudioExample, SoundRecorder } from '@genai-fi/classifier';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import i18n, { i18nReady } from '../../i18n';
import TrainingClassCard from './TrainingClassCard';
import TrainingDataPanel from './TrainingDataPanel';
import type { SoundSample } from './model';

const soundClassifierMocks = vi.hoisted(() => ({
    createSoundRecorder: vi.fn<() => Promise<SoundRecorder>>(),
}));

vi.mock('./soundClassifier', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./soundClassifier')>();
    return {
        ...actual,
        createSoundRecorder: soundClassifierMocks.createSoundRecorder,
    };
});

function createSample(id: string, clipId: string): SoundSample {
    return {
        id,
        clipId,
        data: {
            label: 'Bird',
            spectrogram: { data: new Float32Array(0), frameSize: 232 },
            rawAudio: { data: new Float32Array([0, 0.5, -0.25]), sampleRateHz: 44_100 },
        } satisfies AudioExample,
    };
}

describe('TrainingClassCard recording selection', () => {
    beforeAll(async () => {
        await i18nReady;
        await i18n.changeLanguage('en-GB');
    });

    it('requires selecting a recording before playing or deleting it', async () => {
        const user = userEvent.setup();
        const onRemoveSample = vi.fn();
        const stopSource = vi.fn();
        const createBuffer = vi.fn((_channels: number, length: number) => {
            const channel = new Float32Array(length);
            return {
                channel,
                getChannelData: () => channel,
            };
        });
        class AudioContextMock {
            destination = {};
            state = 'running';
            createBuffer = createBuffer;
            createBufferSource() {
                let onEnded: (() => void) | undefined;
                stopSource.mockImplementation(() => queueMicrotask(() => onEnded?.()));
                return {
                    buffer: null,
                    connect: vi.fn(),
                    addEventListener: (_event: string, listener: () => void) => { onEnded = listener; },
                    start: vi.fn(),
                    stop: stopSource,
                };
            }
            close = vi.fn(async () => { this.state = 'closed'; });
        }
        vi.stubGlobal('AudioContext', AudioContextMock);

        render(
            <WorkflowLayout connections={[]} columns={1}>
                <TrainingClassCard
                    active
                    editing={false}
                    menuOpen={false}
                    micPanelOpen={false}
                    soundClass={{ id: 'bird', name: 'Bird', icon: 'bird', tone: 'blue' }}
                    sampleCount={2}
                    samples={[
                        createSample('frame-1', 'clip-1'),
                        createSample('frame-2', 'clip-2'),
                    ]}
                    canRemove
                    onAddSamples={vi.fn()}
                    onCaptureError={vi.fn()}
                    onCloseControls={vi.fn()}
                    onEdit={vi.fn()}
                    onOpenRecording={vi.fn()}
                    onRemove={vi.fn()}
                    onRemoveSample={onRemoveSample}
                    onToggleMenu={vi.fn()}
                    onUpdate={vi.fn()}
                />
            </WorkflowLayout>,
        );

        const playButton = screen.getByRole('button', { name: 'Play Bird samples' });
        const deleteButton = screen.getByRole('button', { name: 'Remove one Bird sample' });
        expect(playButton).toBeDisabled();
        expect(deleteButton).toBeDisabled();

        const clips = screen.getAllByRole('button', { name: /Recorded sound samples/ });
        await user.click(clips[1]);

        expect(clips[0]).toHaveAttribute('aria-pressed', 'false');
        expect(clips[1]).toHaveAttribute('aria-pressed', 'true');
        expect(playButton).toBeEnabled();
        expect(deleteButton).toBeEnabled();

        await user.click(playButton);
        await waitFor(() => expect(createBuffer).toHaveBeenCalledWith(1, 3, 44_100));
        expect(screen.getByRole('button', { name: 'Stop Bird' })).toBeEnabled();
        expect(clips[1]).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Stop Bird' }));
        expect(stopSource).toHaveBeenCalledOnce();
        await waitFor(() => expect(playButton).toHaveAccessibleName('Play Bird samples'));

        await user.click(deleteButton);
        expect(onRemoveSample).toHaveBeenCalledWith('bird', 'clip-2');
    });

    it('lets a class colour be previewed and saved with its name and icon', async () => {
        const user = userEvent.setup();
        const onUpdate = vi.fn();
        function EditableCard() {
            const [editing, setEditing] = useState(false);
            return (
                <WorkflowLayout connections={[]} columns={1}>
                    <TrainingClassCard
                        active={false}
                        editing={editing}
                        menuOpen={false}
                        micPanelOpen={false}
                        soundClass={{ id: 'bird', name: 'Bird', icon: 'bird', tone: 'blue' }}
                        sampleCount={0}
                        samples={[]}
                        canRemove
                        onAddSamples={vi.fn()}
                        onCaptureError={vi.fn()}
                        onCloseControls={() => setEditing(false)}
                        onEdit={() => setEditing(true)}
                        onOpenRecording={vi.fn()}
                        onRemove={vi.fn()}
                        onRemoveSample={vi.fn()}
                        onToggleMenu={vi.fn()}
                        onUpdate={onUpdate}
                    />
                </WorkflowLayout>
            );
        }

        const { container } = render(<EditableCard />);

        await user.click(screen.getByRole('button', { name: 'Edit Bird class' }));
        const orange = screen.getByRole('button', { name: 'Use Orange colour' });
        await user.click(orange);

        expect(orange).toHaveAttribute('aria-pressed', 'true');
        expect(container.querySelector('.training-class-card')).toHaveClass('training-class-card--orange');

        await user.click(screen.getByRole('button', { name: 'Done' }));
        expect(onUpdate).toHaveBeenCalledWith('bird', {
            name: 'Bird',
            icon: 'bird',
            tone: 'orange',
        });
    });

    it('shows the recording as a live sample before it is stopped', async () => {
        const user = userEvent.setup();
        const listeners = new Map<string, (...args: unknown[]) => void>();
        const recorder = {
            on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
                listeners.set(event, listener);
            }),
            startRecording: vi.fn().mockResolvedValue(undefined),
            stopRecording: vi.fn(),
            removeAllListeners: vi.fn(),
        } as unknown as SoundRecorder;
        soundClassifierMocks.createSoundRecorder.mockResolvedValue(recorder);
        const onAddSamples = vi.fn();

        function RecordableCard() {
            const [micPanelOpen, setMicPanelOpen] = useState(false);
            return (
                <>
                    <WorkflowLayout connections={[]} columns={1}>
                        <div className="training-data-panel">
                            <TrainingClassCard
                                active={false}
                                editing={false}
                                menuOpen={false}
                                micPanelOpen={micPanelOpen}
                                soundClass={{ id: 'bird', name: 'Bird', icon: 'bird', tone: 'blue' }}
                                sampleCount={0}
                                samples={[]}
                                canRemove
                                onAddSamples={onAddSamples}
                                onCaptureError={vi.fn()}
                                onCloseControls={() => setMicPanelOpen(false)}
                                onEdit={vi.fn()}
                                onOpenRecording={() => setMicPanelOpen(true)}
                                onRemove={vi.fn()}
                                onRemoveSample={vi.fn()}
                                onToggleMenu={vi.fn()}
                                onUpdate={vi.fn()}
                            />
                        </div>
                    </WorkflowLayout>
                    <button type="button">Outside training data</button>
                </>
            );
        }

        const { container } = render(<RecordableCard />);

        await user.click(screen.getByRole('button', { name: 'Record Bird' }));
        await user.click(screen.getByRole('button', { name: 'Record' }));

        await waitFor(() => expect(soundClassifierMocks.createSoundRecorder).toHaveBeenCalledOnce());
        const liveSample = container.querySelector('.training-recording-panel__live-sample');
        expect(liveSample).toBeInTheDocument();
        expect(liveSample?.querySelector('.training-waveform')).not.toHaveClass('training-waveform--clip');
        expect(onAddSamples).not.toHaveBeenCalled();

        const example = createSample('live-frame', 'live-recording').data;
        act(() => listeners.get('example')?.(example));

        expect(liveSample?.querySelector('.training-waveform')).toHaveClass('training-waveform--clip');
        expect(onAddSamples).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Outside training data' }));
        expect(recorder.stopRecording).toHaveBeenCalledOnce();
        expect(container.querySelector('.training-recording-panel')).toBeInTheDocument();

        act(() => listeners.get('stop')?.());

        await waitFor(() => expect(onAddSamples).toHaveBeenCalledOnce());
        expect(onAddSamples).toHaveBeenCalledWith('bird', [example]);
        expect(container.querySelector('.training-recording-panel__live-sample')).not.toBeInTheDocument();
        expect(container.querySelector('.training-recording-panel')).not.toBeInTheDocument();
    });

    it('records class samples from the microphone selected in the dropdown', async () => {
        const user = userEvent.setup();
        const enumerateDevices = vi.fn().mockResolvedValue([
            { deviceId: 'default', kind: 'audioinput', label: 'Default microphone' },
            { deviceId: 'usb-microphone', kind: 'audioinput', label: 'USB microphone' },
            { deviceId: 'camera', kind: 'videoinput', label: 'Camera' },
        ]);
        Object.defineProperty(navigator, 'mediaDevices', {
            configurable: true,
            value: { enumerateDevices },
        });
        const recorder = {
            on: vi.fn(),
            startRecording: vi.fn().mockResolvedValue(undefined),
            stopRecording: vi.fn(),
            removeAllListeners: vi.fn(),
        } as unknown as SoundRecorder;
        soundClassifierMocks.createSoundRecorder.mockClear();
        soundClassifierMocks.createSoundRecorder.mockResolvedValue(recorder);

        function RecordableCard() {
            const [micPanelOpen, setMicPanelOpen] = useState(false);
            return (
                <WorkflowLayout connections={[]} columns={1}>
                    <div className="training-data-panel">
                        <TrainingClassCard
                            active={false}
                            editing={false}
                            menuOpen={false}
                            micPanelOpen={micPanelOpen}
                            soundClass={{ id: 'bird', name: 'Bird', icon: 'bird', tone: 'blue' }}
                            sampleCount={0}
                            samples={[]}
                            canRemove
                            onAddSamples={vi.fn()}
                            onCaptureError={vi.fn()}
                            onCloseControls={() => setMicPanelOpen(false)}
                            onEdit={vi.fn()}
                            onOpenRecording={() => setMicPanelOpen(true)}
                            onRemove={vi.fn()}
                            onRemoveSample={vi.fn()}
                            onToggleMenu={vi.fn()}
                            onUpdate={vi.fn()}
                        />
                    </div>
                </WorkflowLayout>
            );
        }

        render(<RecordableCard />);

        await user.click(screen.getByRole('button', { name: 'Record Bird' }));
        await user.click(screen.getByRole('button', { name: /Sound input source: Microphone \(Default\)/ }));
        await user.click(await screen.findByRole('option', { name: 'USB microphone' }));
        expect(screen.getByRole('button', { name: 'Sound input source: USB microphone' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Record' }));

        await waitFor(() => expect(recorder.startRecording).toHaveBeenCalledWith(
            'Bird',
            expect.objectContaining({ deviceId: { exact: 'usb-microphone' } }),
        ));
        expect(enumerateDevices).toHaveBeenCalledOnce();
    });

    it('keeps only one class microphone panel open at a time', async () => {
        const user = userEvent.setup();

        render(
            <WorkflowLayout connections={[]} columns={1}>
                <TrainingDataPanel
                    classes={[
                        { id: 'bird', name: 'Bird', icon: 'bird', tone: 'blue' },
                        { id: 'cat', name: 'Cat', icon: 'cat', tone: 'green' },
                    ]}
                    samples={{ bird: [], cat: [] }}
                    onAddClass={vi.fn()}
                    onAddSamples={vi.fn()}
                    onCaptureError={vi.fn()}
                    onRemoveClass={vi.fn()}
                    onRemoveSample={vi.fn()}
                    onUpdateClass={vi.fn()}
                />
            </WorkflowLayout>,
        );

        await user.click(screen.getByRole('button', { name: 'Record Bird' }));
        const birdCard = screen.getByRole('heading', { name: 'Bird' }).closest('.training-class-card');
        const catCard = screen.getByRole('heading', { name: 'Cat' }).closest('.training-class-card');
        expect(birdCard?.querySelector('.training-recording-panel')).toBeInTheDocument();
        expect(catCard?.querySelector('.training-recording-panel')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Record Cat' }));
        expect(birdCard?.querySelector('.training-recording-panel')).not.toBeInTheDocument();
        expect(catCard?.querySelector('.training-recording-panel')).toBeInTheDocument();
        expect(document.querySelectorAll('.training-recording-panel')).toHaveLength(1);
    });
});
