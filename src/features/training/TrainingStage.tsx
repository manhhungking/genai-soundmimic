import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import DataObjectRounded from '@mui/icons-material/DataObjectRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import StorageRounded from '@mui/icons-material/StorageRounded';
import WorkflowNode from './WorkflowNode';

export type TrainingStatus = 'ready' | 'loading' | 'done';

type TrainingStageProps = {
    classCount: number;
    sampleCount: number;
    status: TrainingStatus;
    onTrain: () => void;
};

export default function TrainingStage({ classCount, sampleCount, status, onTrain }: TrainingStageProps) {
    return (
        <WorkflowNode
            className="training-stage"
            nodeId="trainer"
            active={sampleCount > 0}
        >
            <header>
                <h2>Training</h2>
                <button
                    className="icon-button"
                    type="button"
                    aria-label="Training settings"
                >
                    <SettingsRounded />
                </button>
            </header>
            <div className={`training-stage__brain${status === 'loading' ? ' is-training' : ''}`}>
                <DataObjectRounded />
            </div>
            <h3>{status === 'done' ? 'Training complete!' : status === 'loading' ? 'Learning your sounds…' : 'Ready to train'}</h3>
            <p>
                {status === 'done'
                    ? 'Your sound model is ready to try.'
                    : 'The model will learn the sound classes using the examples on the left.'}
            </p>
            <button
                className="train-classifier-button"
                type="button"
                disabled={status === 'loading' || classCount < 2 || sampleCount === 0}
                onClick={onTrain}
            >
                {status === 'done' ? <CheckCircleRounded /> : <PlayArrowRounded />}
                {status === 'loading' ? 'Training…' : status === 'done' ? 'Train again' : 'Train Classifier'}
            </button>
            <div className="model-summary">
                <h3>Model Summary</h3>
                <p>
                    <DataObjectRounded /> <strong>{classCount}</strong> classes
                </p>
                <p>
                    <StorageRounded /> <strong>{sampleCount}</strong> samples
                </p>
                <p>
                    <span className="model-summary__ready" /> Ready to train
                </p>
            </div>
            <p className="training-stage__tip">
                <InfoOutlined /> Add more samples to help your model learn.
            </p>
        </WorkflowNode>
    );
}
