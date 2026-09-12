import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import Brand from '../components/Brand';
import CornerControls from '../components/CornerControls';
import ProjectLinks from '../components/ProjectLinks';

export function Component() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');

    function joinSession(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!code.trim()) {
            setMessage('Ask your teacher for the class code, then try again.');
            return;
        }
        navigate('/home');
    }

    return (
        <main className="entry-page">
            <div className="entry-page__glow" />
            <div className="entry-page__content">
                <Brand large />
                <form
                    className="join-card"
                    onSubmit={joinSession}
                >
                    <h1>Student — Enter code</h1>
                    <label htmlFor="session-code">Class or session code</label>
                    <input
                        id="session-code"
                        value={code}
                        onChange={(event) => {
                            setCode(event.target.value.toUpperCase());
                            setMessage('');
                        }}
                        placeholder="Try ABCD12"
                        autoComplete="off"
                        maxLength={8}
                    />
                    {message && (
                        <p
                            className="join-card__message"
                            role="alert"
                        >
                            {message}
                        </p>
                    )}
                    <button
                        className="primary-button"
                        type="submit"
                    >
                        Start exploring
                    </button>
                    <div className="join-card__divider">
                        <span />
                        or
                        <span />
                    </div>
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => navigate('/home')}
                    >
                        Teacher — Create a new session
                    </button>
                </form>
            </div>
            <ProjectLinks entry />
            <CornerControls />
        </main>
    );
}
