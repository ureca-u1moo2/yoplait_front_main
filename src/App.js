import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './MainPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import PlanListPage from './pages/PlanListPage';
import PlanDetailPage from './pages/PlanDetailPage';
import PlanComparePage from './pages/PlanComparePage';
import MyPage from './pages/MyPage';
import MainLayout from './components/layout/MainLayout';
import FindPasswordPage from './FindPasswordPage';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<MainLayout />}>
          <Route path="/" element={<PlanListPage />} />
          <Route path="/plans" element={<PlanListPage />} />
          <Route path="/plans/:id" element={<PlanDetailPage />} />
          <Route path="/plans/compare" element={<PlanComparePage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
        </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App; 