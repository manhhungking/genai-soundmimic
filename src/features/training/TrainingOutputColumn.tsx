import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getSoundNameKey } from '../../locales/sounds';
import TrainingWaveform from './TrainingWaveform';
import WorkflowNode from './WorkflowNode';
import type { SoundClass } from './model';

const previewScores = [82, 11, 5, 2];

type TrainingOutputColumnProps = {
    classes: SoundClass[];
};

function InputPanel() {
    const { t } = useTranslation();
    const fileRef = useRef<HTMLInputElement>(null);
    const [enabled, setEnabled] = useState(true);
    const [tab, setTab] = useState<'mic' | 'file'>('mic');
    const [fileName, setFileName] = useState('');

    function handleFile(event: ChangeEvent<HTMLInputElement>) {
        setFileName(event.target.files?.[0]?.name ?? '');
    }

    return (
        <WorkflowNode
            className="sound-input-panel train-surface"
            nodeId="input"
            active={enabled}
        >
            <header>
                <h2>{t('train.input')}</h2>
                <label className="input-switch">
                    <span>{t(enabled ? 'train.on' : 'train.off')}</span>
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(event) => setEnabled(event.target.checked)}
                        aria-label={t('train.enableInput')}
                    />
                    <i />
                </label>
            </header>
            <div className="input-tabs" role="tablist" aria-label={t('train.inputSource')}>
                <button
                    className={tab === 'mic' ? 'is-active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={tab === 'mic'}
                    onClick={() => setTab('mic')}
                >
                    {t('train.mic')}
                </button>
                <button
                    className={tab === 'file' ? 'is-active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={tab === 'file'}
                    onClick={() => setTab('file')}
                >
                    {t('train.file')}
                </button>
            </div>
            {tab === 'mic' ? (
                <>
                    <button className="microphone-select" type="button">
                        <MicRounded /> {t('train.microphoneDefault')} <span>⌄</span>
                    </button>
                    <TrainingWaveform active={enabled} />
                </>
            ) : (
                <div className="input-file-state">
                    <UploadFileRounded />
                    <p>{fileName || t('train.chooseFileHint')}</p>
                    <button type="button" onClick={() => fileRef.current?.click()}>
                        {t('train.chooseFile')}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFile}
                        aria-label={t('train.chooseInputFile')}
                    />
                </div>
            )}
        </WorkflowNode>
    );
}
function ClassifierPreview({ classes }: TrainingOutputColumnProps) {
    const { t } = useTranslation();

    return (
        <WorkflowNode className="classifier-preview train-surface" nodeId="classifier">
            <header>
                <div>
                    <h2>{t('train.preview')}</h2>
                    <p>{t('train.previewDescription')}</p>
                </div>
                <AutoAwesomeRounded />
            </header>
            <ul>
                {classes.map((soundClass, index) => {
                    const score = previewScores[index] ?? 0;
                    const defaultNameKey = getSoundNameKey(soundClass.name);
                    return (
                        <li key={soundClass.id}>
                            <strong>{defaultNameKey ? t(defaultNameKey) : soundClass.name}</strong>
                            <div className={`classifier-preview__bar classifier-preview__bar--${soundClass.tone}`}>
                                <span style={{ width: `${score}%` }} />
                            </div>
                            <b>{score}%</b>
                        </li>
                    );
                })}
            </ul>
        </WorkflowNode>
    );
}

function XaiActions() {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');

    return (
        <WorkflowNode className="training-xai-actions" nodeId="xai-actions">
            <div className="training-xai-actions__intro">
                <span><LightbulbRounded /></span>
                <div>
                    <h2>{t('train.xaiTitle')}</h2>
                    <p>{t('train.xaiDescription')}</p>
                </div>
            </div>
            <div className="training-xai-actions__buttons">
                <button type="button" onClick={() => setMessage(t('train.statisticsNotice'))}>
                    <BarChartRounded /> {t('train.statistics')}
                </button>
                <Link to="/xai">
                    <AutoAwesomeRounded /> {t('train.explain')}
                </Link>
            </div>
            {message && <p className="training-xai-actions__message" role="status">{message}</p>}
        </WorkflowNode>
    );
}

export default function TrainingOutputColumn({ classes }: TrainingOutputColumnProps) {
    return (
        <div className="training-output-column">
            <InputPanel />
            <ClassifierPreview classes={classes} />
            <XaiActions />
        </div>
    );
}
