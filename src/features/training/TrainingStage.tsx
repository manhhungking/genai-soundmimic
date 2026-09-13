import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import DataObjectRounded from '@mui/icons-material/DataObjectRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import StorageRounded from '@mui/icons-material/StorageRounded';
import { useTranslation } from 'react-i18next';
import WorkflowNode from './WorkflowNode';

export type TrainingStatus = 'ready' | 'loading' | 'done';

type TrainingStageProps = {
    classCount: number;
    sampleCount: number;
    canTrain: boolean;
    status: TrainingStatus;
    onTrain: () => void;
};

export default function TrainingStage({ classCount, sampleCount, canTrain, status, onTrain }: TrainingStageProps) {
    const { t } = useTranslation();

    return (
        <WorkflowNode
            className="training-stage"
            nodeId="trainer"
            active={sampleCount > 0}
        >
            <header>
                <h2>{t('train.stageTitle')}</h2>
                <button
                    className="icon-button"
                    type="button"
                    aria-label={t('train.settings')}
                >
                    <SettingsRounded />
                </button>
            </header>
            <div className={`training-stage__brain${status === 'loading' ? ' is-training' : ''}`}>
                <DataObjectRounded />
            </div>
            <h3>
                {t(status === 'done' ? 'train.complete' : status === 'loading' ? 'train.learning' : 'train.ready')}
            </h3>
            <p>
                {status === 'done'
                    ? t('train.modelReady')
                    : t('train.modelDescription')}
            </p>
            <button
                className="train-classifier-button"
                type="button"
                disabled={status === 'loading' || !canTrain}
                onClick={onTrain}
            >
                {status === 'done' ? <CheckCircleRounded /> : <PlayArrowRounded />}
                {t(status === 'loading' ? 'train.training' : status === 'done' ? 'train.trainAgain' : 'train.trainClassifier')}
            </button>
            <div className="model-summary">
                <h3>{t('train.modelSummary')}</h3>
                <p>
                    <DataObjectRounded /> {t('train.classCount', { count: classCount })}
                </p>
                <p>
                    <StorageRounded /> {t('train.sampleCount', { count: sampleCount })}
                </p>
                <p>
                    <span className="model-summary__ready" /> {t('train.ready')}
                </p>
            </div>
            <p className="training-stage__tip">
                <InfoOutlined /> {t('train.tip')}
            </p>
        </WorkflowNode>
    );
}
