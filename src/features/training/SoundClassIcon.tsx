import BackHandRounded from '@mui/icons-material/BackHandRounded';
import FlutterDashRounded from '@mui/icons-material/FlutterDashRounded';
import GraphicEqRounded from '@mui/icons-material/GraphicEqRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import PetsRounded from '@mui/icons-material/PetsRounded';
import type { SoundIconKey } from './model';

type SoundClassIconProps = {
    icon: SoundIconKey;
};

export default function SoundClassIcon({ icon }: SoundClassIconProps) {
    switch (icon) {
        case 'bird':
            return <FlutterDashRounded />;
        case 'cat':
            return <PetsRounded />;
        case 'clap':
            return <BackHandRounded />;
        case 'bell':
            return <NotificationsRounded />;
        case 'music':
            return <MusicNoteRounded />;
        default:
            return <GraphicEqRounded />;
    }
}
