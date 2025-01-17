import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Amplify, Hub } from 'aws-amplify';

import { getConfig } from './config';
import { AuthProvider, RequireAuth } from './auth/Auth';
import LandingPage from './landing/LandingPage';
import ProfilePage from './profile/ProfilePage';
import ProfileEditorPage from './profile/ProfileEditorPage';
import { ApiProvider } from './api/Api';
import CalendarPage from './calendar/CalendarPage';
import MeetingPage from './meeting/MeetingPage';
import ListMeetingsPage from './meeting/ListMeetingsPage';
import Navbar from './navbar/Navbar';
import SigninPage from './auth/SigninPage';
import SignupPage from './auth/SignupPage';
import VerifyEmailPage from './auth/VerifyEmailPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import AdminPage from './admin/AdminPage';
import { CacheProvider } from './api/cache/Cache';
import GroupMeetingPage from './meeting/GroupMeetingPage';
import GamePage from './games/view/GamePage';
import ListGamesPage from './games/ListGamesPage';
import AvailabilityBooker from './calendar/AvailabilityBooker';
import ScoreboardPage from './scoreboard/ScoreboardPage';
import NotFoundPage from './NotFoundPage';
import RequirementPage from './requirements/RequirementPage';
import { GraduationPrompt } from './profile/GraduationPrompt';
import RecentPage from './recent/RecentPage';
import HelpPage from './help/HelpPage';
import RequirementEditorPage from './requirements/RequirementEditorPage';
import EditGamePage from './games/EditGamePage';
import ThemeProvider from './ThemeProvider';
import StatisticsPage from './scoreboard/statistics/StatisticsPage';
import { useEffect } from 'react';
import MaterialPage from './material/MaterialPage';

const config = getConfig();
Amplify.configure({
    Auth: {
        region: config.auth.region,
        userPoolId: config.auth.userPoolId,
        userPoolWebClientId: config.auth.userPoolWebClientId,
        oauth: {
            domain: config.auth.oauth.domain,
            scope: config.auth.oauth.scope,
            redirectSignIn: config.auth.oauth.redirectSignIn,
            redirectSignOut: config.auth.oauth.redirectSignOut,
            responseType: config.auth.oauth.responseType,
        },
    },
});

function App() {
    useEffect(() => {
        Hub.listen('auth', (data) => {
            if (data.payload.event === 'signIn_failure') {
                console.log('Sign in failure: ', data);
            } else {
                console.log('Other auth data: ', data);
            }
        });
    }, []);

    return (
        <AuthProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <ApiProvider>
                        <CacheProvider>
                            <Navbar />
                            <Router />
                        </CacheProvider>
                    </ApiProvider>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}

function Router() {
    return (
        <Routes>
            <Route path='/'>
                <Route index element={<LandingPage />} />
                <Route path='signin' element={<SigninPage />} />
                <Route path='signup' element={<SignupPage />} />
                <Route path='verify-email' element={<VerifyEmailPage />} />
                <Route path='forgot-password' element={<ForgotPasswordPage />} />
                <Route path='help' element={<HelpPage />} />

                <Route element={<RequireAuth />}>
                    <Route element={<GraduationPrompt />}>
                        <Route path='profile'>
                            <Route index element={<ProfilePage />} />
                            <Route path='edit' element={<ProfileEditorPage />} />
                            <Route path=':username' element={<ProfilePage />} />
                        </Route>
                        <Route path='admin' element={<AdminPage />} />

                        <Route path='recent' element={<RecentPage />} />
                        <Route path='calendar' element={<CalendarPage />}>
                            <Route
                                path='availability/:id'
                                element={<AvailabilityBooker />}
                            />
                        </Route>
                        <Route path='meeting'>
                            <Route index element={<ListMeetingsPage />} />
                            <Route path=':meetingId' element={<MeetingPage />} />
                        </Route>
                        <Route
                            path='group/:availabilityId'
                            element={<GroupMeetingPage />}
                        />
                        <Route path='games'>
                            <Route index element={<ListGamesPage />} />
                            <Route path='submit' element={<EditGamePage />} />
                            <Route path=':cohort/:id'>
                                <Route index element={<GamePage />} />
                                <Route path='edit' element={<EditGamePage />} />
                            </Route>
                        </Route>

                        <Route path='scoreboard'>
                            <Route index element={<ScoreboardPage />} />
                            <Route path=':cohort' element={<ScoreboardPage />} />
                            <Route path='stats' element={<StatisticsPage />} />
                        </Route>

                        <Route path='requirements'>
                            <Route path='new' element={<RequirementEditorPage />} />
                            <Route path=':id'>
                                <Route index element={<RequirementPage />} />
                                <Route path='edit' element={<RequirementEditorPage />} />
                            </Route>
                        </Route>

                        <Route path='material'>
                            <Route index element={<MaterialPage />} />
                        </Route>
                    </Route>
                </Route>
                <Route path='*' element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}

export default App;
