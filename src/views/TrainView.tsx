import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import { WorkflowLayout, type IConnection } from '@genai-fi/base';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import type { AppOutletContext } from '../components/AppLayout';
import TrainingDataPanel from '../features/training/TrainingDataPanel';
import TrainingOutputColumn from '../features/training/TrainingOutputColumn';
import SaveModelDialog, { type SaveModelSelection } from '../features/training/SaveModelDialog';
import TrainingStage from '../features/training/TrainingStage';
import { downloadBlob, toZipFileName } from '../util/download';

export function Component() {
    const { t } = useTranslation();
    const { training } = useOutletContext<AppOutletContext>();
    const {
        addClass,
        addSamples,
        canSave,
        canTrain,
        classes,
        loadModel,
        notice,
        predict,
        predictions,
        removeClass,
        removeSample,
        samples,
        saveModel,
        setNotice,
        trainClassifier,
        trainingStatus,
        updateClass,
    } = training;
    const loadRef = useRef<HTMLInputElement>(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const connections = useMemo<IConnection[]>(() => [
        ...classes.map(({ id }) => ({
            start: `class-${id}`,
            end: 'trainer',
            startPoint: 'right' as const,
            endPoint: 'left' as const,
        })),
        { start: 'trainer', end: 'input', startPoint: 'right', endPoint: 'left' },
        { start: 'input', end: 'classifier', startPoint: 'bottom', endPoint: 'top' },
        { start: 'classifier', end: 'xai-actions', startPoint: 'bottom', endPoint: 'top' },
    ], [classes]);

    async function handleSaveModel(selection: SaveModelSelection) {
        const blob = await saveModel(selection);
        downloadBlob(blob, toZipFileName(selection.name));
    }

    return (
        <div className="train-page">
            <header className="train-toolbar">
                <div>
                    <h1>{t('train.title')}</h1>
                    <p>{t('train.description')}</p>
                </div>
                <div className="train-toolbar__actions">
                    <button type="button" onClick={() => loadRef.current?.click()}>
                        <FolderOpenRounded /> {t('train.loadModel')}
                    </button>
                    <button
                        aria-haspopup="dialog"
                        className="is-primary"
                        type="button"
                        onClick={() => setSaveDialogOpen(true)}
                    >
                        <SaveRounded /> {t('train.saveModel')}
                    </button>
                    <input
                        ref={loadRef}
                        type="file"
                        accept="application/zip,.zip"
                        onChange={loadModel}
                        aria-label={t('train.loadModelAria')}
                    />
                </div>
            </header>

            <div className="train-workflow">
                <WorkflowLayout connections={connections} columns={3}>
                    <TrainingDataPanel
                        classes={classes}
                        samples={samples}
                        onAddClass={addClass}
                        onAddSamples={addSamples}
                        onCaptureError={() => setNotice(t('train.errorNotice'))}
                        onRemoveClass={removeClass}
                        onRemoveSample={removeSample}
                        onUpdateClass={updateClass}
                    />
                    <TrainingStage
                        canTrain={canTrain}
                        status={trainingStatus}
                        onTrain={trainClassifier}
                    />
                    <TrainingOutputColumn
                        classes={classes}
                        canPredict={canSave}
                        predictions={predictions}
                        onPredict={predict}
                    />
                </WorkflowLayout>
            </div>
            {notice && <p className="train-notice" role="status">{notice}</p>}
            {saveDialogOpen && (
                <SaveModelDialog
                    canSave={canSave}
                    onClose={() => setSaveDialogOpen(false)}
                    onSave={handleSaveModel}
                    open
                />
            )}
        </div>
    );
}
