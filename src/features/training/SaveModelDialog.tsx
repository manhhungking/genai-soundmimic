import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

export type SaveModelSelection = {
    includeBehaviours: boolean;
    includeSamples: boolean;
    name: string;
};

type SaveModelDialogProps = {
    canSave: boolean;
    onClose: () => void;
    onSave: (selection: SaveModelSelection) => Promise<void>;
    open: boolean;
};

export default function SaveModelDialog({ canSave, onClose, onSave, open }: SaveModelDialogProps) {
    const { t } = useTranslation();
    const [includeBehaviours, setIncludeBehaviours] = useState(true);
    const [includeSamples, setIncludeSamples] = useState(true);
    const [name, setName] = useState(() => t('train.defaultModelName'));
    const [saving, setSaving] = useState(false);
    const [saveFailed, setSaveFailed] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const savingRef = useRef(false);

    useEffect(() => {
        if (!open) return;

        nameInputRef.current?.focus();
        nameInputRef.current?.select();

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape' && !savingRef.current) onClose();
        }

        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [onClose, open]);

    if (!open) return null;

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!canSave || !trimmedName || saving) return;

        setSaving(true);
        savingRef.current = true;
        setSaveFailed(false);
        try {
            await onSave({ includeBehaviours, includeSamples, name: trimmedName });
            savingRef.current = false;
            setSaving(false);
            onClose();
        } catch {
            savingRef.current = false;
            setSaving(false);
            setSaveFailed(true);
        }
    }

    return (
        <div
            className="save-model-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) onClose();
            }}
        >
            <section
                aria-describedby="save-model-description"
                aria-labelledby="save-model-title"
                aria-modal="true"
                className="save-model-dialog"
                role="dialog"
            >
                <header>
                    <h2 id="save-model-title">{t('train.saveDialogTitle')}</h2>
                </header>

                <form
                    aria-busy={saving}
                    onSubmit={submit}
                >
                    <div className="save-model-dialog__content">
                        <p id="save-model-description">
                            {t(canSave ? 'train.saveMessage' : 'train.saveNoModel')}
                        </p>

                        <label className="save-model-dialog__name">
                            <span>{t('train.modelName')}</span>
                            <input
                                aria-label={t('train.modelName')}
                                disabled={saving}
                                maxLength={80}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    setSaveFailed(false);
                                }}
                                ref={nameInputRef}
                                type="text"
                                value={name}
                            />
                        </label>

                        <div className="save-model-dialog__options">
                            <label>
                                <input
                                    checked={includeSamples}
                                    disabled={saving}
                                    onChange={(event) => setIncludeSamples(event.target.checked)}
                                    type="checkbox"
                                />
                                <span>{t('train.saveSamples')}</span>
                            </label>
                            <label>
                                <input
                                    checked
                                    disabled
                                    readOnly
                                    type="checkbox"
                                />
                                <span>{t('train.saveClassifierOption')}</span>
                            </label>
                            <label>
                                <input
                                    checked={includeBehaviours}
                                    disabled={!canSave || saving}
                                    onChange={(event) => setIncludeBehaviours(event.target.checked)}
                                    type="checkbox"
                                />
                                <span>{t('train.saveBehaviors')}</span>
                            </label>
                        </div>

                        {saveFailed && (
                            <p
                                className="save-model-dialog__error"
                                role="alert"
                            >
                                {t('train.saveFailed')}
                            </p>
                        )}
                    </div>

                    <footer>
                        <button
                            className="save-model-dialog__save"
                            disabled={!canSave || !name.trim() || saving}
                            type="submit"
                        >
                            {t(saving ? 'train.saving' : 'train.saveAction')}
                        </button>
                        <button
                            className="save-model-dialog__cancel"
                            disabled={saving}
                            onClick={onClose}
                            type="button"
                        >
                            {t('train.cancelSave')}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
