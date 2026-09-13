import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import { useTranslation } from 'react-i18next';
import WorkflowNode from './WorkflowNode';

export type TrainingStatus = 'ready' | 'loading' | 'done';

type TrainingStageProps = {
    sampleCount: number;
    canTrain: boolean;
    status: TrainingStatus;
    onTrain: () => void;
};

export default function TrainingStage({ sampleCount, canTrain, status, onTrain }: TrainingStageProps) {
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
            <div className="training-stage__body">
                <button
                    aria-busy={status === 'loading'}
                    className="train-classifier-button"
                    type="button"
                    disabled={status === 'loading' || !canTrain}
                    onClick={onTrain}
                >
                    {status === 'done' ? <CheckCircleRounded /> : <PlayArrowRounded />}
                    {t(status === 'loading' ? 'train.training' : status === 'done' ? 'train.trainAgain' : 'train.trainClassifier')}
                </button>
                {status === 'done' && (
                    <p className="training-stage__status" role="status">
                        <CheckCircleRounded /> {t('train.complete')}
                    </p>
                )}
                {status === 'ready' && !canTrain && (
                    <p className="training-stage__tip">
                        <InfoOutlined /> {t('train.tip')}
                    </p>
                )}
            </div>
        </WorkflowNode>
    );
}
