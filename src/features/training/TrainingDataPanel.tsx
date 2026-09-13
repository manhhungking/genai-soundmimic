import AddRounded from '@mui/icons-material/AddRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import TrainingClassCard from './TrainingClassCard';
import type { AudioExample } from '@genai-fi/classifier';
import type { SoundClass, SoundSamplesByClass } from './model';

type TrainingDataPanelProps = {
    classes: SoundClass[];
    samples: SoundSamplesByClass;
    onAddClass: () => void;
    onAddSamples: (id: string, samples: AudioExample[]) => void;
    onCaptureError: () => void;
    onRemoveClass: (id: string) => void;
    onRemoveSample: (id: string) => void;
    onUpdateClass: (id: string, patch: Pick<SoundClass, 'name' | 'icon'>) => void;
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

    return (
        <section className="training-data-panel">
            <header className="training-data-panel__heading">
                <div>
                    <h2>{t('train.dataTitle')}</h2>
                    <p>{t('train.dataDescription')}</p>
                </div>
                <InfoOutlined aria-label={t('train.dataInfo')} />
            </header>
            <div className="training-class-list">
                {classes.map((soundClass, index) => (
                    <TrainingClassCard
                        key={soundClass.id}
                        soundClass={soundClass}
                        sampleCount={samples[soundClass.id]?.length ?? 0}
                        sample={samples[soundClass.id]?.at(-1)?.data}
                        isBackgroundNoise={index === 0}
                        canRemove={classes.length > 2}
                        onAddSamples={onAddSamples}
                        onCaptureError={onCaptureError}
                        onRemove={onRemoveClass}
                        onRemoveSample={onRemoveSample}
                        onUpdate={onUpdateClass}
                    />
                ))}
            </div>
            <button
                className="add-class-button"
                type="button"
                onClick={onAddClass}
            >
                <AddRounded /> {t('train.addClass')}
            </button>
        </section>
    );
}
