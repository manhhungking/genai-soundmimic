import CloseRounded from '@mui/icons-material/CloseRounded';
import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const QRCode = lazy(() => import('@genai-fi/base/components/QRCode'));

type JoinCodeDialogProps = {
    code: string;
    onClose: () => void;
    open: boolean;
};

export default function JoinCodeDialog({ code, onClose, open }: JoinCodeDialogProps) {
    const { i18n, t } = useTranslation();
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const joinUrl = useMemo(() => {
        const url = new URL(import.meta.env.BASE_URL, window.location.origin);
        url.searchParams.set('code', code);
        url.searchParams.set('lng', i18n.resolvedLanguage ?? i18n.language);
        return url.toString();
    }, [code, i18n.language, i18n.resolvedLanguage]);
    const joinAddress = useMemo(() => {
        const url = new URL(joinUrl);
        return `${url.host}${url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')}`;
    }, [joinUrl]);

    useEffect(() => {
        if (!open) return;

        closeButtonRef.current?.focus();
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [onClose, open]);

    if (!open) return null;

    return (
        <div
            className="settings-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                aria-labelledby="join-code-title"
                aria-modal="true"
                className="join-code-dialog"
                role="dialog"
            >
                <header>
                    <h2 id="join-code-title">{t('join.title')}</h2>
                    <button
                        aria-label={t('join.close')}
                        onClick={onClose}
                        ref={closeButtonRef}
                        type="button"
                    >
                        <CloseRounded aria-hidden="true" />
                    </button>
                </header>

                <div className="join-code-dialog__content">
                    <div className="join-code-dialog__qr">
                        <h3>{t('join.scan')}</h3>
                        <div className="join-code-dialog__canvas">
                            <Suspense fallback={<div className="join-code-dialog__qr-placeholder" />}>
                                <QRCode
                                    label={t('join.qrLabel')}
                                    size="large"
                                    url={joinUrl}
                                />
                            </Suspense>
                        </div>
                    </div>
                    <div className="join-code-dialog__manual">
                        <h3>{t('join.manual')}</h3>
                        <strong data-testid="join-code">{code}</strong>
                        <span>{joinAddress}</span>
                    </div>
                </div>

                <footer>
                    <p>{t('join.waiting')}</p>
                    <button
                        className="primary-button"
                        onClick={onClose}
                        type="button"
                    >
                        {t('join.closeButton')}
                    </button>
                </footer>
            </section>
        </div>
    );
}
