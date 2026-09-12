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

    it('validates a class code and opens the app home', async () => {
        const user = userEvent.setup();
        renderRoute('/');

        await user.click(await screen.findByRole('button', { name: 'Start exploring' }));
        expect(screen.getByRole('alert')).toHaveTextContent('Ask your teacher for the class code');

        await user.type(screen.getByLabelText('Class or session code'), 'abcd12');
        await user.click(screen.getByRole('button', { name: 'Start exploring' }));
        expect(await screen.findByRole('heading', { name: 'Welcome!' }, { timeout: 5000 })).toBeInTheDocument();
    });

    it('shows a reusable class code and QR link for learners', async () => {
        const user = userEvent.setup();
        renderRoute('/home');

        const openButtons = await screen.findAllByRole('button', { name: 'Show join code' });
        await user.click(openButtons[0]);

        const dialog = screen.getByRole('dialog', { name: 'Connect learners' });
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
});
