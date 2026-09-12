import { RouterProvider, type RouterProviderProps } from 'react-router';
import './i18n';
import { defaultRouter } from './router';

type AppProps = {
    router?: RouterProviderProps['router'];
};

export default function App({ router = defaultRouter }: AppProps) {
    return <RouterProvider router={router} />;
}
