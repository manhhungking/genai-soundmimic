import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import { useTranslation } from 'react-i18next';
import WorkflowNode from './WorkflowNode';

export type TrainingStatus = 'ready' | 'loading' | 'done';

type TrainingStageProps = {
    canTrain: boolean;
    status: TrainingStatus;
    onTrain: () => void;
};

export default function TrainingStage({ canTrain, status, onTrain }: TrainingStageProps) {
    const { t } = useTranslation();

    return (
        <WorkflowNode
            className="training-stage"
            nodeId="trainer"
            active={canTrain}
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
                    className={`train-classifier-button${status === 'loading' ? ' is-loading' : ''}`}
                    type="button"
                    disabled={status === 'loading' || !canTrain}
                    onClick={onTrain}
                >
                    {status === 'loading' && <span className="train-classifier-button__spinner" aria-hidden="true" />}
                    <span>{t(status === 'done' ? 'train.trainAgain' : 'train.trainClassifier')}</span>
                </button>
                {status === 'loading' && (
                    <div className="training-stage__progress" role="status" aria-live="polite">
                        <span>{t('train.training')}</span>
                        <span
                            aria-label={t('train.training')}
                            className="training-stage__progress-track"
                            role="progressbar"
                        >
                            <span />
                        </span>
                    </div>
                )}
                {status === 'done' && (
                    <p className="training-stage__status" role="status">
                        <CheckCircleRounded /> <span>{t('train.complete')}</span>
                    </p>
                )}
                {status === 'ready' && !canTrain && (
                    <p className="training-stage__tip">
                        <InfoOutlined /> <span>{t('train.tip')}</span>
                    </p>
                )}
            </div>
        </WorkflowNode>
    );
}
