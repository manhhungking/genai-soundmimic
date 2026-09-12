import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';

export default function LanguageControl() {
    return (
        <label className="language-control">
            <LanguageRounded aria-hidden="true" />
            <select
                aria-label="Language"
                defaultValue="en"
            >
                <option value="en">English</option>
            </select>
            <ExpandMoreRounded aria-hidden="true" />
        </label>
    );
}
