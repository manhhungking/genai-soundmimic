import WifiOffRounded from '@mui/icons-material/WifiOffRounded';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router';
import GameExperience from '../features/play/GameExperience';
import { useStudentGameSession } from '../features/play/useGameSession';
import type { RecordingResult } from '../features/play/useSoundRecorder';
import { defaultStudentProfile, studentProfileStorageKey } from '../data/profile';
import { readProfile } from '../util/profile';

export function Component() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code') ?? '';
    const [player] = useState(() => readProfile(studentProfileStorageKey, defaultStudentProfile));
    const session = useStudentGameSession({ code, player });
    const { sendRecording } = session;

    const recordingComplete = useCallback(({ dataUrl }: RecordingResult) => {
        sendRecording(dataUrl);
    }, [sendRecording]);

    if (!/^\d{8}$/.test(code) || !player.name.trim()) return <Navigate replace to="/" />;

    if (!session.snapshot || !session.setup) {
        return (
            <main className="student-stage-shell is-connecting">
                <div className="student-stage-shell__backdrop" />
                <section role="status">
                    <WifiOffRounded />
                    <h1>{t('play.joiningStage')}</h1>
                    <p>{t('play.joiningDescription', { code })}</p>
                </section>
            </main>
        );
    }

    return (
        <main className="student-stage-shell">
            <GameExperience
                connectionReady={session.connected}
                isHost={false}
                onAdvance={() => undefined}
                onBegin={() => undefined}
                onPerformanceEnded={() => undefined}
                onRecordingCancel={session.cancelRecording}
                onRecordingComplete={recordingComplete}
                onRecordingStart={session.requestRecordingStart}
                onReferenceEnded={() => undefined}
                onRetry={session.requestRetry}
                onReveal={() => undefined}
                setup={session.setup}
                snapshot={session.snapshot}
                viewerPlayerId={session.playerId}
            />
        </main>
    );
}
