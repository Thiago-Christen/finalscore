import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './components/AuthLayout';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ChoosePage from './pages/ChoosePage';
import Dashboard from './pages/Dashboard';
import Championships from './pages/Championships';
import Teams from './pages/Teams';
import Matches from './pages/Matches';
import Project from './pages/Project';
import LoadingRedirect from './pages/LoadingRedirect';

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/choose" element={<ChoosePage />} />
        <Route path="/redirect" element={<LoadingRedirect />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/campeonatos" element={<Championships />} />
          <Route path="/times" element={<Teams />} />
          <Route path="/partidas" element={<Matches />} />
          <Route path="/projeto" element={<Project />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
