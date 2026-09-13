import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppHero from '../components/AppHero';
import Avatar from '../components/Avatar';
import PanelHeading from '../components/PanelHeading';
import Waveform from '../components/Waveform';
import { students } from '../data/home';

export function Component() {
    const { t } = useTranslation();
    const [recording, setRecording] = useState(true);
    const [playing, setPlaying] = useState(false);

    return (
        <div className="view-page play-view">
            <AppHero
                title={t('play.title')}
                description={t('play.description')}
                slogan={t('play.slogan')}
                bubble={t('play.myTurn')}
                status={
                    <>
                        {t('play.turnProgress', { current: 1, total: 4 })}
                        <br />
                        {t('play.personTurn', { name: 'Leo' })}
                    </>
                }
            />

            <section className="play-grid">
                <article className="app-panel recording-panel">
                    <PanelHeading
                        icon={<MicRounded />}
                        title={t('play.recordTitle')}
                    />
                    <Waveform active={recording} />
                    <p className="recording-panel__time">{recording ? '0:02 / 0:03' : '0:03 / 0:03'}</p>
                    <button
                        className={`record-button${recording ? ' is-recording' : ''}`}
                        type="button"
                        onClick={() => setRecording((value) => !value)}
                        aria-label={t(recording ? 'play.stopRecording' : 'play.recordAgain')}
                    >
                        {recording ? <StopRounded /> : <MicRounded />}
                    </button>
                    <strong className="recording-panel__action">
                        {t(recording ? 'play.stopRecording' : 'play.recordAgain')}
                    </strong>
                </article>

                <article className="app-panel turn-panel">
                    <PanelHeading
                        icon={<GroupsRounded />}
                        title={t('play.turnOrder')}
                    />
                    <ol>
                        {students.map((student, index) => (
                            <li
                                key={student.name}
                                className={index === 0 ? 'is-current' : ''}
                            >
                                <span>{index + 1}</span>
                                <Avatar
                                    name={student.name}
                                    variant={student.avatar}
                                    size="small"
                                />
                                <strong>{student.name}</strong>
                                {index === 0 && <em>{t('play.playingNow')}</em>}
                            </li>
                        ))}
                    </ol>
                </article>

                <article className="app-panel playback-panel">
                    <PanelHeading
                        icon={<PlayArrowRounded />}
                        title={t('play.playRecording')}
                    />
                    <div className="playback-panel__body">
                        <button
                            type="button"
                            onClick={() => setPlaying((value) => !value)}
                            aria-label={t(playing ? 'play.pauseRecording' : 'play.playRecording')}
                        >
                            {playing ? <span className="pause-icon">Ⅱ</span> : <PlayArrowRounded />}
                        </button>
                        <Waveform
                            active={playing}
                            compact
                        />
                        <span>{playing ? '0:01 / 0:03' : '0:00 / 0:03'}</span>
                    </div>
                </article>

                <article className="app-panel guess-panel">
                    <PanelHeading
                        icon={<AutoAwesomeRounded />}
                        title={t('play.aiGuess')}
                    />
                    <div className="guess-panel__result">
                        <span
                            className="animal-emoji"
                            role="img"
                            aria-label={t('sound.bird')}
                        >
                            🐦
                        </span>
                        <strong>{t('sound.bird')}</strong>
                        <div>
                            <span>
                                {t('play.confidence')} <strong>82%</strong>
                            </span>
                            <div className="confidence-bar">
                                <span style={{ width: '82%' }} />
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <section className="up-next-strip">
                <span className="up-next-strip__icon">
                    <TimerOutlined />
                </span>
                <strong>{t('play.upNext')}</strong>
                <Avatar
                    name="Maya"
                    variant="sophia"
                    size="small"
                />
                <p>{t('play.personNext', { name: 'Maya' })}</p>
                <span className="up-next-strip__status">{t('play.getReady')}</span>
            </section>
        </div>
    );
}
