import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppProvider } from './context/AppContext';
import { I18nProvider } from './context/I18nContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RootRedirect } from './routes/RootRedirect';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AppProvider>
          <Suspense fallback={<div className="app-loading">Preparando tu espacio...</div>}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<OverviewPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                  <Route path="board" element={<BoardPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="timeline" element={<TimelinePage />} />
                  <Route path="security" element={<Navigate to="../overview" replace />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>

              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </Suspense>
        </AppProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
