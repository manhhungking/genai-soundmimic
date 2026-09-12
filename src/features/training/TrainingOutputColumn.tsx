import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import { useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import TrainingWaveform from './TrainingWaveform';
import WorkflowNode from './WorkflowNode';
import type { SoundClass } from './model';

const previewScores = [82, 11, 5, 2];

type TrainingOutputColumnProps = {
    classes: SoundClass[];
};

function InputPanel() {
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
                <h2>Input</h2>
                <label className="input-switch">
                    <span>{enabled ? 'On' : 'Off'}</span>
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(event) => setEnabled(event.target.checked)}
                        aria-label="Enable sound input"
                    />
                    <i />
                </label>
            </header>
            <div className="input-tabs" role="tablist" aria-label="Sound input source">
                <button
                    className={tab === 'mic' ? 'is-active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={tab === 'mic'}
                    onClick={() => setTab('mic')}
                >
                    Mic
                </button>
                <button
                    className={tab === 'file' ? 'is-active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={tab === 'file'}
                    onClick={() => setTab('file')}
                >
                    File
                </button>
            </div>
            {tab === 'mic' ? (
                <>
                    <button className="microphone-select" type="button">
                        <MicRounded /> Microphone (Default) <span>⌄</span>
                    </button>
                    <TrainingWaveform active={enabled} />
                </>
            ) : (
                <div className="input-file-state">
                    <UploadFileRounded />
                    <p>{fileName || 'Choose a short audio file to test.'}</p>
                    <button type="button" onClick={() => fileRef.current?.click()}>
                        Choose file
                    </button>
                    <input ref={fileRef} type="file" accept="audio/*" onChange={handleFile} aria-label="Choose classifier input file" />
                </div>
            )}
        </WorkflowNode>
    );
}
function ClassifierPreview({ classes }: TrainingOutputColumnProps) {
    return (
        <WorkflowNode className="classifier-preview train-surface" nodeId="classifier">
            <header>
                <div>
                    <h2>Classifier Preview</h2>
                    <p>Test how your sound model responds.</p>
                </div>
                <AutoAwesomeRounded />
            </header>
            <ul>
                {classes.map((soundClass, index) => {
                    const score = previewScores[index] ?? 0;
                    return (
                        <li key={soundClass.id}>
                            <strong>{soundClass.name}</strong>
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
    const [message, setMessage] = useState('');

    return (
        <WorkflowNode className="training-xai-actions" nodeId="xai-actions">
            <div className="training-xai-actions__intro">
                <span><LightbulbRounded /></span>
                <div>
                    <h2>Explore with XAI Round</h2>
                    <p>See what your model learned and explore its guesses.</p>
                </div>
            </div>
            <div className="training-xai-actions__buttons">
                <button type="button" onClick={() => setMessage('Statistics will appear after your next sound test.')}>
                    <BarChartRounded /> Statistics
                </button>
                <Link to="/xai">
                    <AutoAwesomeRounded /> Explain
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
