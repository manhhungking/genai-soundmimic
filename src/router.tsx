import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router';

export const routes = createRoutesFromElements(
    <Route
        hydrateFallbackElement={<div />}
        path="/"
    >
        <Route
            index
            lazy={() => import('./views/SessionEntryView')}
        />
        <Route
            path="join/profile"
            lazy={() => import('./views/ProfileSetupView')}
        />
        <Route
            path="join/play"
            lazy={() => import('./views/StudentPlayView')}
        />
        <Route lazy={() => import('./components/AppLayout')}>
            <Route
                path="home"
                lazy={() => import('./views/HomeView')}
            />
            <Route
                path="train"
                lazy={() => import('./views/TrainView')}
            />
            <Route
                path="setup"
                lazy={() => import('./views/GameSetupView')}
            />
            <Route
                path="play"
                lazy={() => import('./views/PlayView')}
            />
            <Route
                path="results"
                lazy={() => import('./views/ResultsView')}
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
