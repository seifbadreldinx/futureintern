import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Chatbot } from './components/Chatbot';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { BrowseInternships } from './pages/BrowseInternships';
import { InternshipDetail } from './pages/InternshipDetail';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { CompanyRegister } from './pages/CompanyRegister';
import { Companies } from './pages/Companies';
import { About } from './pages/About';
import { ContactUs } from './pages/ContactUs';
import { GetHelp } from './pages/GetHelp';
import { Careers } from './pages/Careers';
import { Press } from './pages/Press';
import { FAQ } from './pages/FAQ';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { useEffect } from 'react';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <main className="flex-grow page-enter">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/browse" element={<BrowseInternships />} />
          <Route path="/internship/:id" element={<InternshipDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/register-company" element={<CompanyRegister />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/get-help" element={<GetHelp />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/press" element={<Press />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
