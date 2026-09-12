import { RouterProvider, type RouterProviderProps } from 'react-router';
import { ColorModeProvider } from './hooks/useColorMode';
import './i18n';
import { defaultRouter } from './router';

type AppProps = {
    router?: RouterProviderProps['router'];
};

export default function App({ router = defaultRouter }: AppProps) {
    return (
        <ColorModeProvider>
            <RouterProvider router={router} />
        </ColorModeProvider>
    );
}
