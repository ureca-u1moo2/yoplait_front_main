import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PlanListPage from './pages/PlanListPage';
import PlanDetailPage from './pages/PlanDetailPage';
import PlanComparePage from './pages/PlanComparePage';
import MyPage from './pages/MyPage';
import MainLayout from './components/layout/MainLayout';
import FindPasswordPage from './pages/FindPasswordPage';
import FAQPage from './pages/FAQPage';
import ChatbotPage from './pages/ChatbotPage';
import { NotificationProvider } from './context/NotificationContext'; // 알림 context

function App() {
  return (
    <Router>
      <div>
        <NotificationProvider> 
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
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
        </Route>
        </Routes>
        </NotificationProvider>
      </div>
    </Router>
  );
}

export default App; 