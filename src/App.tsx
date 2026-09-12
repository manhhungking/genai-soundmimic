import { RouterProvider, type RouterProviderProps } from 'react-router';
import { defaultRouter } from './router';

type AppProps = {
    router?: RouterProviderProps['router'];
};

export default function App({ router = defaultRouter }: AppProps) {
    return <RouterProvider router={router} />;
}
