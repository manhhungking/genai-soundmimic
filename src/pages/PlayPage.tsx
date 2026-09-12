import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import { useState } from 'react';
import AppHero from '../components/AppHero';
import Avatar from '../components/Avatar';
import PanelHeading from '../components/PanelHeading';
import Waveform from '../components/Waveform';
import { students } from '../data/home';

export function Component() {
    const [recording, setRecording] = useState(true);
    const [playing, setPlaying] = useState(false);

    return (
        <div className="view-page play-view">
            <AppHero
                title="Play"
                description={
                    <>
                        Take turns. Record a sound.
                        <br />
                        Hear the AI guess.
                    </>
                }
                slogan={
                    <>
                        Sounds
                        <br />
                        bring us together.
                    </>
                }
                bubble="My turn!"
                status={
                    <>
                        1 of 4
                        <br />
                        Leo’s turn
                    </>
                }
            />

            <section className="play-grid">
                <article className="app-panel recording-panel">
                    <PanelHeading
                        icon={<MicRounded />}
                        title="Record your sound"
                    />
                    <Waveform active={recording} />
                    <p className="recording-panel__time">{recording ? '0:02 / 0:03' : '0:03 / 0:03'}</p>
                    <button
                        className={`record-button${recording ? ' is-recording' : ''}`}
                        type="button"
                        onClick={() => setRecording((value) => !value)}
                        aria-label={recording ? 'Stop recording' : 'Record again'}
                    >
                        {recording ? <StopRounded /> : <MicRounded />}
                    </button>
                    <strong className="recording-panel__action">{recording ? 'Stop recording' : 'Record again'}</strong>
                </article>

                <article className="app-panel turn-panel">
                    <PanelHeading
                        icon={<GroupsRounded />}
                        title="Turn order"
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
                                {index === 0 && <em>Playing now</em>}
                            </li>
                        ))}
                    </ol>
                </article>

                <article className="app-panel playback-panel">
                    <PanelHeading
                        icon={<PlayArrowRounded />}
                        title="Play your recording"
                    />
                    <div className="playback-panel__body">
                        <button
                            type="button"
                            onClick={() => setPlaying((value) => !value)}
                            aria-label={playing ? 'Pause recording' : 'Play recording'}
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
                        title="AI Guess"
                    />
                    <div className="guess-panel__result">
                        <span
                            className="animal-emoji"
                            role="img"
                            aria-label="Bird"
                        >
                            🐦
                        </span>
                        <strong>Bird</strong>
                        <div>
                            <span>
                                Confidence <strong>82%</strong>
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
                <strong>Up Next</strong>
                <Avatar
                    name="Maya"
                    variant="sophia"
                    size="small"
                />
                <p>Maya is next!</p>
                <span className="up-next-strip__status">Get ready…</span>
            </section>
        </div>
    );
}
