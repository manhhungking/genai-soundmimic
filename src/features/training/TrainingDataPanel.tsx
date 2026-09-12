import AddRounded from '@mui/icons-material/AddRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import TrainingClassCard from './TrainingClassCard';
import type { SoundClass } from './model';

type TrainingDataPanelProps = {
    classes: SoundClass[];
    onAddClass: () => void;
    onAddSamples: (id: string, count: number) => void;
    onRemoveClass: (id: string) => void;
    onRemoveSample: (id: string) => void;
    onUpdateClass: (id: string, patch: Pick<SoundClass, 'name' | 'icon'>) => void;
};

export default function TrainingDataPanel({
    classes,
    onAddClass,
    onAddSamples,
    onRemoveClass,
    onRemoveSample,
    onUpdateClass,
}: TrainingDataPanelProps) {
    return (
        <section className="training-data-panel">
            <header className="training-data-panel__heading">
                <div>
                    <h2>Training Data</h2>
                    <p>Add audio examples for each class.</p>
                </div>
                <InfoOutlined aria-label="Each class needs a few clear sound examples" />
            </header>
            <div className="training-class-list">
                {classes.map((soundClass) => (
                    <TrainingClassCard
                        key={soundClass.id}
                        soundClass={soundClass}
                        canRemove={classes.length > 2}
                        onAddSamples={onAddSamples}
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
                <AddRounded /> Add a class
            </button>
        </section>
    );
}
