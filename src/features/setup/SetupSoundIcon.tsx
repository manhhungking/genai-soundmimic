import type { SetupSoundIcon as SetupSoundIconKey } from './model';

type SetupSoundIconProps = {
    icon: SetupSoundIconKey;
};

export default function SetupSoundIcon({ icon }: SetupSoundIconProps) {
    const icons: Record<SetupSoundIconKey, string> = {
        bird: '🐦',
        cat: '🐱',
        clap: '👏',
        whistle: '🎶',
    };

    return <span aria-hidden="true" className="setup-sound-icon">{icons[icon]}</span>;
}
