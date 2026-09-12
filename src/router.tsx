import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router';

export const routes = createRoutesFromElements(
    <Route
        hydrateFallbackElement={<div />}
        path="/"
    >
        <Route
            index
            lazy={() => import('./pages/SessionEntryPage')}
        />
        <Route lazy={() => import('./components/AppLayout')}>
            <Route
                path="home"
                lazy={() => import('./pages/HomePage')}
            />
            <Route
                path="train"
                lazy={() => import('./pages/TrainPage')}
            />
            <Route
                path="play"
                lazy={() => import('./pages/PlayPage')}
            />
            <Route
                path="results"
                lazy={() => import('./pages/ResultsPage')}
            />
            <Route
                path="xai"
                element={
                    <Navigate
                        replace
                        to="/results"
                    />
                }
            />
        </Route>
    </Route>
);

export const defaultRouter = createBrowserRouter(routes);
