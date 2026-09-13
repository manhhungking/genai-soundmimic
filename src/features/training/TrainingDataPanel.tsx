import AddRounded from '@mui/icons-material/AddRounded';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TrainingClassCard from './TrainingClassCard';
import type { AudioExample } from '@genai-fi/classifier';
import { groupSoundSamplesByClip } from '../../util/soundSamples';
import type { SoundClass, SoundSamplesByClass } from './model';
import { hasEnoughSamplesForClass } from './soundClassifier';

type TrainingDataPanelProps = {
    classes: SoundClass[];
    samples: SoundSamplesByClass;
    onAddClass: () => void;
    onAddSamples: (id: string, samples: AudioExample[]) => void;
    onCaptureError: () => void;
    onRemoveClass: (id: string) => void;
    onRemoveSample: (id: string, clipId: string) => void;
    onUpdateClass: (id: string, patch: Pick<SoundClass, 'name' | 'icon' | 'tone'>) => void;
};

type OpenClassControl = {
    classId: string;
    type: 'edit' | 'menu';
};

export default function TrainingDataPanel({
    classes,
    samples,
    onAddClass,
    onAddSamples,
    onCaptureError,
    onRemoveClass,
    onRemoveSample,
    onUpdateClass,
}: TrainingDataPanelProps) {
    const { t } = useTranslation();
    const panelRef = useRef<HTMLElement>(null);
    const [openClassControl, setOpenClassControl] = useState<OpenClassControl | null>(null);

    useEffect(() => {
        if (!openClassControl) return;

        function closeWhenClickingOutside(event: PointerEvent) {
            if (panelRef.current?.contains(event.target as Node)) return;
            setOpenClassControl(null);
        }

        document.addEventListener('pointerdown', closeWhenClickingOutside);
        return () => document.removeEventListener('pointerdown', closeWhenClickingOutside);
    }, [openClassControl]);

    function toggleClassMenu(classId: string) {
        setOpenClassControl((current) => (
            current?.classId === classId && current.type === 'menu'
                ? null
                : { classId, type: 'menu' }
        ));
    }

    return (
        <section className="training-data-panel" ref={panelRef}>
            <header className="training-data-panel__heading">
                <div>
                    <h2>{t('train.dataTitle')}</h2>
                    <p>{t('train.dataDescription')}</p>
                </div>
            </header>
            <div className="training-class-list">
                {classes.map((soundClass, index) => (
                    <TrainingClassCard
                        key={soundClass.id}
                        active={hasEnoughSamplesForClass(index, samples[soundClass.id] ?? [])}
                        editing={openClassControl?.classId === soundClass.id && openClassControl.type === 'edit'}
                        menuOpen={openClassControl?.classId === soundClass.id && openClassControl.type === 'menu'}
                        soundClass={soundClass}
                        sampleCount={groupSoundSamplesByClip(samples[soundClass.id] ?? []).length}
                        samples={samples[soundClass.id] ?? []}
                        canRemove={classes.length > 2}
                        onAddSamples={onAddSamples}
                        onCaptureError={onCaptureError}
                        onCloseControls={() => setOpenClassControl(null)}
                        onEdit={() => setOpenClassControl({ classId: soundClass.id, type: 'edit' })}
                        onRemove={(id) => {
                            setOpenClassControl(null);
                            onRemoveClass(id);
                        }}
                        onRemoveSample={onRemoveSample}
                        onToggleMenu={() => toggleClassMenu(soundClass.id)}
                        onUpdate={onUpdateClass}
                    />
                ))}
            </div>
            <button
                className="add-class-button"
                type="button"
                onClick={() => {
                    setOpenClassControl(null);
                    onAddClass();
                }}
            >
                <AddRounded /> {t('train.addClass')}
            </button>
        </section>
    );
}
