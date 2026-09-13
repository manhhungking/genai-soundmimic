import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import i18n, { i18nReady } from './i18n';
import { routes } from './router';

function renderRoute(path: string) {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    render(<App router={router} />);
    return router;
}

describe('sound mimic routes', () => {
    beforeEach(async () => {
        await i18nReady;
        window.localStorage.clear();
        window.sessionStorage.clear();
        delete document.documentElement.dataset.colorMode;
        await i18n.changeLanguage('en-GB');
    });

    it('validates a class code and lets a student choose their profile', async () => {
        const user = userEvent.setup();
        renderRoute('/');

        await user.click(await screen.findByRole('button', { name: 'Start exploring' }));
        expect(screen.getByRole('alert')).toHaveTextContent('Ask your teacher for the class code');

        await user.type(screen.getByLabelText('Class or session code'), 'abcd12');
        await user.click(screen.getByRole('button', { name: 'Start exploring' }));
        expect(screen.getByRole('alert')).toHaveTextContent('Enter the 8-digit class code');

        await user.clear(screen.getByLabelText('Class or session code'));
        await user.type(screen.getByLabelText('Class or session code'), '12345678');
        await user.click(screen.getByRole('button', { name: 'Start exploring' }));

        expect(await screen.findByRole('heading', { name: 'Choose your player' })).toBeInTheDocument();
        await user.type(screen.getByLabelText('Display name'), 'Alex');
        await user.click(screen.getByRole('radio', { name: 'Choose avatar 3' }));
        await user.click(screen.getByRole('button', { name: 'Join class' }));

        expect(screen.getByRole('heading', { name: 'You’re ready, Alex!' })).toBeInTheDocument();
        expect(JSON.parse(window.localStorage.getItem('soundmimic-student-profile') ?? '{}')).toEqual({
            avatar: 'sophia',
            name: 'Alex',
        });
    });

    it('shows a reusable class code and QR link for learners', async () => {
        const user = userEvent.setup();
        renderRoute('/home');

        const openButtons = await screen.findAllByRole('button', { name: 'Show join code' });
        await user.click(openButtons[0]);

        const dialog = screen.getByRole('dialog', { name: 'Connect learners' });
        expect(within(dialog).queryByRole('button', { name: 'Leave class' })).not.toBeInTheDocument();
        const classCode = within(dialog).getByTestId('join-code').textContent ?? '';
        expect(classCode).toMatch(/^\d{8}$/);
        expect(screen.getAllByText(classCode)).toHaveLength(2);

        const qrLink = await within(dialog).findByRole('link', { name: 'QR code to join the class' });
        const qrUrl = new URL(qrLink.getAttribute('href') ?? '');
        expect(qrUrl.searchParams.get('code')).toBe(classCode);
        expect(qrUrl.searchParams.get('lng')).toBe('en-GB');
        expect(await within(dialog).findByTestId('qr-code-canvas')).toBeInTheDocument();

        await user.click(within(dialog).getByRole('button', { name: 'Close' }));
        expect(screen.queryByRole('dialog', { name: 'Connect learners' })).not.toBeInTheDocument();
    });

    it('opens the group menu and updates the selected group', async () => {
        const user = userEvent.setup();
        renderRoute('/home');

        const groupButton = await screen.findByRole('button', { name: 'Group: Group 1' });
        expect(groupButton).toHaveAttribute('aria-expanded', 'false');
        await user.click(groupButton);

        const groupList = screen.getByRole('listbox', { name: 'Group' });
        expect(groupList).toBeInTheDocument();
        expect(within(groupList).getAllByRole('option')).toHaveLength(2);

        await user.click(within(groupList).getByRole('option', { name: 'Sound Explorers' }));
        expect(groupButton).toHaveAttribute('aria-label', 'Group: Sound Explorers');
        expect(groupButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('keeps profile settings separate and updates the host identity', async () => {
        const user = userEvent.setup();
        renderRoute('/home');

        await user.click(await screen.findByRole('button', { name: 'Open profile menu for Jordan Davis' }));
        expect(screen.getByRole('button', { name: 'Leave class' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Profile settings' }));

        const dialog = screen.getByRole('dialog', { name: 'Profile settings' });
        const nameInput = within(dialog).getByLabelText('Display name');
        await user.clear(nameInput);
        await user.type(nameInput, 'Ms Rivera');
        await user.click(within(dialog).getByRole('radio', { name: 'Choose avatar 3' }));
        await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

        expect(screen.getByRole('button', { name: 'Open profile menu for Ms Rivera' })).toBeInTheDocument();
        expect(JSON.parse(window.localStorage.getItem('soundmimic-host-profile') ?? '{}')).toEqual({
            avatar: 'sophia',
            name: 'Ms Rivera',
        });

        await user.click(screen.getByRole('button', { name: 'Open profile menu for Ms Rivera' }));
        expect(window.sessionStorage.getItem('genai-sm-idcode-8')).not.toBeNull();
        await user.click(screen.getByRole('button', { name: 'Leave class' }));
        expect(await screen.findByRole('heading', { name: 'Student — Enter code' })).toBeInTheDocument();
        expect(window.sessionStorage.getItem('genai-sm-idcode-8')).toBeNull();
    });

    it('prefills the class code and locale from a scanned join link', async () => {
        renderRoute('/?code=12345678&lng=vi-VN');

        const codeInput = await screen.findByLabelText('Mã lớp hoặc phiên chơi');
        expect(codeInput).toHaveValue('12345678');
        expect(screen.getByRole('button', { name: 'Bắt đầu khám phá' })).toBeInTheDocument();
    });

    it('supports the student recording control', async () => {
        const user = userEvent.setup();
        renderRoute('/play');

        await user.click(await screen.findByRole('button', { name: 'Stop recording' }));
        expect(screen.getByRole('button', { name: 'Record again' })).toBeInTheDocument();
    });

    it('shows predictions first and adds XAI results only when the host enables them', async () => {
        const user = userEvent.setup();
        renderRoute('/results');

        expect(await screen.findByRole('heading', { name: 'Session Results' })).toBeInTheDocument();
        expect(screen.getByRole('table', { name: 'AI predictions for Round 1' })).toBeInTheDocument();
        expect(screen.queryByLabelText('XAI results for Round 1')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Turn on XAI explanations' }));
        expect(screen.getByLabelText('XAI results for Round 1')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Turn off XAI explanations' }));
        expect(screen.queryByLabelText('XAI results for Round 1')).not.toBeInTheDocument();
    });

    it('collapses and expands the shared desktop navigation', async () => {
        const user = userEvent.setup();
        renderRoute('/home');

        const collapseButton = await screen.findByRole('button', { name: 'Collapse navigation' });
        await user.click(collapseButton);

        expect(screen.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('navigation', { name: 'Main navigation' }).closest('aside')).toHaveClass(
            'sidebar--collapsed',
        );

        await user.click(screen.getByRole('button', { name: 'Expand navigation' }));
        expect(screen.getByRole('button', { name: 'Collapse navigation' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('switches color mode and remembers the host preference', async () => {
        const user = userEvent.setup();
        renderRoute('/home');

        await user.click((await screen.findAllByRole('button', { name: 'Settings' }))[0]);
        expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();

        await user.click(await screen.findByRole('button', { name: 'Use dark mode' }));
        expect(document.documentElement).toHaveAttribute('data-color-mode', 'dark');
        expect(window.localStorage.getItem('soundmimic-color-mode')).toBe('dark');

        await user.click(screen.getByRole('button', { name: 'Use light mode' }));
        expect(document.documentElement).toHaveAttribute('data-color-mode', 'light');
        expect(window.localStorage.getItem('soundmimic-color-mode')).toBe('light');
    });

    it('switches language across the app and remembers the preference', async () => {
        const user = userEvent.setup();
        renderRoute('/home');

        const languageButton = await screen.findByRole('button', { name: 'Language: English' });
        expect(languageButton).toHaveAttribute('aria-expanded', 'false');
        await user.click(languageButton);
        expect(languageButton).toHaveAttribute('aria-expanded', 'true');
        const languageList = screen.getByRole('listbox', { name: 'Language' });
        expect(within(languageList).getAllByRole('option')).toHaveLength(16);

        await user.click(within(languageList).getByRole('option', { name: 'Tiếng Việt' }));

        expect(await screen.findByRole('heading', { name: 'Chào mừng!' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Huấn luyện' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ngôn ngữ: Tiếng Việt' })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
        expect(window.localStorage.getItem('sound-mimic-language')).toBe('vi-VN');
        expect(document.documentElement).toHaveAttribute('lang', 'vi-VN');
    });

    it('lets students rename a training class, change its icon, and add another class', async () => {
        const user = userEvent.setup();
        renderRoute('/train');

        expect(await screen.findByRole('heading', { name: 'Classifier' })).toBeInTheDocument();
        expect(screen.getByText('You must train your classifier first.')).toBeInTheDocument();
        expect(screen.getByText('Add more samples to help your model learn.')).toBeInTheDocument();
        expect(screen.queryByLabelText('Each class needs a few clear sound examples')).not.toBeInTheDocument();

        await user.click(await screen.findByRole('button', { name: 'Edit Bird class' }, { timeout: 5000 }));
        const nameInput = screen.getByRole('textbox', { name: 'Class name' });
        await user.clear(nameInput);
        await user.type(nameInput, 'Robin');
        await user.click(screen.getByRole('button', { name: 'Use Bell icon' }));
        await user.click(screen.getByRole('button', { name: 'Done' }));

        expect(screen.getByRole('button', { name: 'Edit Robin class' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Add a class' }));
        expect(screen.getByRole('heading', { name: 'Class 5' })).toBeInTheDocument();
    });

    it('lets the host build, edit, save, and start a game setup', async () => {
        const user = userEvent.setup();
        const router = renderRoute('/setup');

        expect(await screen.findByRole('heading', { level: 1, name: 'Game Setup' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Host game controls')).not.toBeInTheDocument();

        await user.click(screen.getByRole('radio', { name: /Use one selected model/ }));
        await user.click(screen.getByRole('button', { name: /Maya’s Model/ }));
        expect(screen.getByText('Selected Model')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Change the challenge for round 1' }));
        expect(screen.getAllByText('Break').length).toBeGreaterThan(1);

        await user.click(screen.getAllByRole('button', { name: 'Edit clip' })[1]);
        expect(screen.getByText('Editing: fast_clap.wav')).toBeInTheDocument();
        const startTime = screen.getByLabelText(/Start time/);
        const endTime = screen.getByLabelText(/End time/);
        await user.clear(startTime);
        await user.type(startTime, '0.4');
        await user.clear(endTime);
        await user.type(endTime, '1.4');
        await user.click(screen.getByRole('button', { name: 'Use Clip' }));
        expect(screen.getByText('Clip updated')).toBeInTheDocument();
        expect(screen.getByText('1.0')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Add Round' }));
        expect(screen.getByText('Round 5')).toBeInTheDocument();
        expect(screen.getByText('5 rounds')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Save Setup' }));
        const savedSetup = JSON.parse(window.localStorage.getItem('soundmimic-game-setup') ?? '{}');
        expect(savedSetup).toMatchObject({ modelMode: 'single', selectedStudent: 1, version: 1 });
        expect(savedSetup.rounds).toHaveLength(5);

        await router.navigate('/home');
        await router.navigate('/setup');
        expect(await screen.findByText('Round 5')).toBeInTheDocument();
        expect(screen.getByText('Selected Model')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Start Game' }));
        expect(await screen.findByRole('heading', { level: 1, name: 'Play' })).toBeInTheDocument();
    });
});
