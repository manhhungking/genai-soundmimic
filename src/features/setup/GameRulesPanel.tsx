import BarChartRounded from '@mui/icons-material/BarChartRounded';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import { useTranslation } from 'react-i18next';
import SetupStepHeader from './SetupStepHeader';
import type { GameRules, ModelMode, RecordingTime } from './model';

type GameRulesPanelProps = {
    hostParticipates: boolean;
    mode: ModelMode;
    modelCount: number;
    onChange: (rules: GameRules) => void;
    onHostParticipatesChange: (participates: boolean) => void;
    roundCount: number;
    rules: GameRules;
};

type ToggleRowProps = {
    checked: boolean;
    label: string;
    onChange: (checked: boolean) => void;
};

function ToggleRow({ checked, label, onChange }: ToggleRowProps) {
    return (
        <label className="setup-toggle-row">
            <span>{label}</span>
            <input
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                type="checkbox"
            />
            <i aria-hidden="true" />
        </label>
    );
}

export default function GameRulesPanel({
    hostParticipates,
    mode,
    modelCount,
    onChange,
    onHostParticipatesChange,
    roundCount,
    rules,
}: GameRulesPanelProps) {
    const { t } = useTranslation();
    const recordingOptions: RecordingTime[] = ['three', 'clip', 'custom'];

    return (
        <section className="setup-panel setup-rules-panel">
            <SetupStepHeader
                description={t('setup.rulesDescription')}
                number={3}
                title={t('setup.gameRules')}
                tone="teal"
            />

            <fieldset className="setup-rules-fieldset">
                <legend>{t('setup.recordingTime')}</legend>
                <div className="setup-inline-options">
                    {recordingOptions.map((option) => (
                        <label key={option}>
                            <input
                                checked={rules.recordingTime === option}
                                name="recording-time"
                                onChange={() => onChange({ ...rules, recordingTime: option })}
                                type="radio"
                            />
                            <i aria-hidden="true" />
                            {t(`setup.recordingTime.${option}`)}
                        </label>
                    ))}
                </div>
                {rules.recordingTime === 'custom' && (
                    <label className="setup-custom-duration">
                        <span>{t('setup.customDuration')}</span>
                        <input
                            aria-label={t('setup.customDuration')}
                            max="30"
                            min="1"
                            onChange={(event) => onChange({
                                ...rules,
                                customRecordingSeconds: Math.max(1, Math.min(30, Number(event.target.value) || 1)),
                            })}
                            type="number"
                            value={rules.customRecordingSeconds}
                        />
                        <span>{t('setup.seconds')}</span>
                    </label>
                )}
            </fieldset>

            <fieldset className="setup-rules-fieldset">
                <legend>{t('setup.attempts')}</legend>
                <div className="setup-inline-options setup-inline-options--attempts">
                    {([1, 2] as const).map((attempts) => (
                        <label key={attempts}>
                            <input
                                checked={rules.attempts === attempts}
                                name="attempts"
                                onChange={() => onChange({ ...rules, attempts })}
                                type="radio"
                            />
                            <i aria-hidden="true" />
                            {t('setup.attemptCount', { count: attempts })}
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="setup-toggle-list">
                <ToggleRow
                    checked={hostParticipates}
                    label={t('setup.hostParticipates')}
                    onChange={onHostParticipatesChange}
                />
                <ToggleRow
                    checked={rules.playReference}
                    label={t('setup.playReference')}
                    onChange={(playReference) => onChange({ ...rules, playReference })}
                />
                <ToggleRow
                    checked={rules.revealGuess}
                    label={t('setup.revealGuess')}
                    onChange={(revealGuess) => onChange({ ...rules, revealGuess })}
                />
                <ToggleRow
                    checked={rules.showConfidence}
                    label={t('setup.showConfidence')}
                    onChange={(showConfidence) => onChange({ ...rules, showConfidence })}
                />
            </div>

            <div className="setup-summary">
                <h3>{t('setup.sessionSummary')}</h3>
                <p><GridViewRounded /> {t('setup.roundCount', { count: roundCount })}</p>
                <p><GroupsRounded /> {t(mode === 'rotate' ? 'setup.rotatingModelCount' : 'setup.singleModelCount', { count: modelCount })}</p>
                <p><GroupsRounded /> {t(hostParticipates ? 'setup.hostPlaying' : 'setup.hostFacilitating')}</p>
                <p><ScheduleRounded /> {t(`setup.recordingSummary.${rules.recordingTime}`)}</p>
                <p><BarChartRounded /> {t('setup.challengeSummary')}</p>
            </div>
        </section>
    );
}
