import { lazy, Suspense, useEffect } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Lazy load pages and heavy components for performance
const Chatbot = lazy(() => import('./components/Chatbot').then(m => ({ default: m.Chatbot })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const SignUp = lazy(() => import('./pages/SignUp').then(m => ({ default: m.SignUp })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const BrowseInternships = lazy(() => import('./pages/BrowseInternships').then(m => ({ default: m.BrowseInternships })));
const InternshipDetail = lazy(() => import('./pages/InternshipDetail').then(m => ({ default: m.InternshipDetail })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const CreateInternship = lazy(() => import('./pages/CreateInternship').then(m => ({ default: m.CreateInternship })));
const CompanyRegister = lazy(() => import('./pages/CompanyRegister').then(m => ({ default: m.CompanyRegister })));
const Companies = lazy(() => import('./pages/Companies').then(m => ({ default: m.Companies })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const ContactUs = lazy(() => import('./pages/ContactUs').then(m => ({ default: m.ContactUs })));
const GetHelp = lazy(() => import('./pages/GetHelp').then(m => ({ default: m.GetHelp })));
const Careers = lazy(() => import('./pages/Careers').then(m => ({ default: m.Careers })));
const Press = lazy(() => import('./pages/Press').then(m => ({ default: m.Press })));
const FAQ = lazy(() => import('./pages/FAQ').then(m => ({ default: m.FAQ })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const PointsStore = lazy(() => import('./pages/PointsStore').then(m => ({ default: m.PointsStore })));

import { Unauthorized } from './pages/Unauthorized';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      }>
        <main className="flex-grow page-enter">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/browse" element={<BrowseInternships />} />
            <Route path="/internship/:id" element={<InternshipDetail />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/register-company" element={<CompanyRegister />} />
            <Route path="/create-internship" element={<ProtectedRoute><CreateInternship /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/get-help" element={<GetHelp />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/press" element={<Press />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/points" element={<ProtectedRoute><PointsStore /></ProtectedRoute>} />
            <Route path="/points-store" element={<ProtectedRoute><PointsStore /></ProtectedRoute>} />
          </Routes>
        </main>
      </Suspense>
      <Footer />
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
    </>
  );
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex flex-col transition-colors duration-300">
            <AppContent />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
