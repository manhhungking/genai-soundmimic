import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded';
import GraphicEqRounded from '@mui/icons-material/GraphicEqRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import RadioButtonCheckedRounded from '@mui/icons-material/RadioButtonCheckedRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Avatar from '../../components/Avatar';
import { students } from '../../data/home';
import type { TrainingSession } from '../training/useTrainingSession';
import SetupStepHeader from './SetupStepHeader';
import type { ModelMode } from './model';

type ModelSelectionPanelProps = {
    mode: ModelMode;
    onModeChange: (mode: ModelMode) => void;
    onSelectedStudentChange: (studentIndex: number) => void;
    selectedStudent: number;
    training: TrainingSession;
};

export default function ModelSelectionPanel({
    mode,
    onModeChange,
    onSelectedStudentChange,
    selectedStudent,
    training,
}: ModelSelectionPanelProps) {
    const { t } = useTranslation();
    const loadRef = useRef<HTMLInputElement>(null);

    return (
        <section className="setup-panel setup-model-panel">
            <SetupStepHeader
                description={t('setup.modelDescription')}
                number={1}
                title={t('setup.selectModel')}
                tone="blue"
            />

            <div className={`setup-model-status${training.isModelReady ? ' is-ready' : ''}`}>
                <span className="setup-model-status__badge">
                    {training.isModelReady ? <CheckCircleRounded /> : <ErrorOutlineRounded />}
                    <span>
                        {t(
                            training.isModelReady ? 'setup.modelStatusReady' : 'setup.modelStatusMissing',
                            { count: training.classes.length },
                        )}
                    </span>
                </span>
                <div className="setup-model-status__actions">
                    <button onClick={() => loadRef.current?.click()} type="button">
                        <FolderOpenRounded /> {t('setup.loadModel')}
                    </button>
                    <Link to="/train">{t('setup.openTrainStudio')}</Link>
                </div>
                <input
                    accept="application/zip,.zip"
                    aria-label={t('setup.loadModelAria')}
                    onChange={training.loadModel}
                    ref={loadRef}
                    type="file"
                />
            </div>

            <div
                aria-label={t('setup.modelMode')}
                className="setup-choice-group"
                role="radiogroup"
            >
                {(['rotate', 'single'] as const).map((option) => {
                    const active = mode === option;
                    return (
                        <button
                            aria-checked={active}
                            className={active ? 'is-selected' : ''}
                            key={option}
                            onClick={() => onModeChange(option)}
                            role="radio"
                            type="button"
                        >
                            {active ? <RadioButtonCheckedRounded /> : <RadioButtonUncheckedRounded />}
                            <span>
                                <strong>{t(`setup.${option}Models`)}</strong>
                                <small>{t(`setup.${option}ModelsDescription`)}</small>
                            </span>
                        </button>
                    );
                })}
            </div>

            <h3>{t('setup.studentModels')}</h3>
            <div className="setup-model-list">
                {students.map((student, index) => {
                    const active = mode === 'rotate' || selectedStudent === index;
                    return (
                        <button
                            aria-pressed={mode === 'single' && selectedStudent === index}
                            className={active ? 'is-active' : ''}
                            key={student.name}
                            onClick={() => {
                                onModeChange('single');
                                onSelectedStudentChange(index);
                            }}
                            type="button"
                        >
                            <Avatar
                                name={student.name}
                                size="small"
                                variant={student.avatar}
                            />
                            <strong>{t('setup.personModel', { name: student.name })}</strong>
                            <GraphicEqRounded aria-hidden="true" />
                        </button>
                    );
                })}
            </div>

            <div className="setup-rotation">
                <header>
                    <strong>
                        {t(mode === 'rotate' ? 'setup.rotationOrder' : 'setup.selectedModel', {
                            count: students.length,
                        })}
                    </strong>
                    {mode === 'rotate' && <SyncRounded aria-hidden="true" />}
                </header>
                <ol>
                    {(mode === 'rotate' ? students : [students[selectedStudent]]).map((student, index) => (
                        <li key={student.name}>
                            <span>{index + 1}</span>
                            <Avatar
                                name={student.name}
                                size="small"
                                variant={student.avatar}
                            />
                            <strong>{t('setup.personModel', { name: student.name })}</strong>
                        </li>
                    ))}
                </ol>
            </div>
            <p className="setup-help">
                <InfoOutlined aria-hidden="true" />
                {t(mode === 'rotate' ? 'setup.rotationHelp' : 'setup.singleHelp')}
            </p>
        </section>
    );
}
