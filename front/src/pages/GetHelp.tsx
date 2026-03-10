import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    question: 'How do I create an account?',
    answer: 'Click on the "Get Intern" or "Sign Up" button in the navigation bar. Fill in your details including name, email, password, major, interests, and upload your CV. Once completed, you\'ll be able to browse and apply for internships.',
    category: 'Account',
  },
  {
    question: 'What file formats are accepted for CV upload?',
    answer: 'We accept PDF and DOCX file formats only. The maximum file size is 5MB. Make sure your CV is up-to-date and clearly formatted.',
    category: 'Account',
  },
  {
    question: 'How do I apply for an internship?',
    answer: 'Browse through available internships using the search and filter options. Click on any internship that interests you to view details, then click the "Apply Now" button. Make sure your profile is complete before applying.',
    category: 'Applications',
  },
  {
    question: 'Can I apply for multiple internships?',
    answer: 'Yes, you can apply for as many internships as you like. However, we recommend focusing on opportunities that match your skills and interests for better success rates.',
    category: 'Applications',
  },
  {
    question: 'How do I track my applications?',
    answer: 'Once logged in, go to your Dashboard. You\'ll see all your submitted applications with their current status (Pending, Under Review, Accepted, Rejected). You can also view details and updates for each application.',
    category: 'Applications',
  },
  {
    question: 'What happens after I apply?',
    answer: 'After submitting your application, the company will review it. You\'ll receive email notifications about status updates. If selected, the company will contact you directly for the next steps.',
    category: 'Applications',
  },
  {
    question: 'How do I update my profile information?',
    answer: 'Go to your Dashboard and click on "Edit Profile". You can update your personal information, major, interests, and upload a new CV at any time.',
    category: 'Profile',
  },
  {
    question: 'Can I change my password?',
    answer: 'Yes, you can change your password from your Dashboard settings. If you\'ve forgotten your password, use the "Forgot Password" link on the login page.',
    category: 'Account',
  },
  {
    question: 'How does the matching algorithm work?',
    answer: 'Our algorithm matches you with internships based on your major, interests, skills from your CV, and preferences. The more complete your profile, the better matches you\'ll receive.',
    category: 'Matching',
  },
  {
    question: 'Are the internships paid or unpaid?',
    answer: 'Both paid and unpaid internships are available. Each internship listing clearly indicates the compensation details. You can filter internships by compensation type when browsing.',
    category: 'Internships',
  },
  {
    question: 'Can companies see my contact information?',
    answer: 'Your contact information is only shared with companies after you apply for their internship. We respect your privacy and never share your information without your consent.',
    category: 'Privacy',
  },
  {
    question: 'How do I delete my account?',
    answer: 'To delete your account, please contact our support team through the Contact Us page. We\'ll process your request within 48 hours.',
    category: 'Account',
  },
  {
    question: 'What if I have technical issues?',
    answer: 'If you encounter any technical problems, please contact us via email at mohamedsaad@gmail.com or WhatsApp at 0100000000. We\'ll help resolve the issue as quickly as possible.',
    category: 'Support',
  },
  {
    question: 'How do I report an inappropriate internship posting?',
    answer: 'If you come across an internship that seems inappropriate or violates our terms, please report it using the "Report" button on the internship detail page, or contact us directly.',
    category: 'Support',
  },
  {
    question: 'Can I save internships to apply later?',
    answer: 'Yes! You can save internships to your favorites by clicking the bookmark icon. Access your saved internships from your Dashboard.',
    category: 'Features',
  },
];

const categories = ['All', 'Account', 'Applications', 'Profile', 'Matching', 'Internships', 'Privacy', 'Support', 'Features'];

export function GetHelp() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const heroRef = useScrollReveal();
  const faqRef = useScrollReveal();

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section
        ref={heroRef.elementRef}
        className={`education-bg relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float animation-delay-300"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-6">
            <HelpCircle className="w-16 h-16 text-gray-900" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-6 animate-fade-in-up drop-shadow-lg">
            Get Help
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 animate-fade-in-up animation-delay-200 font-medium">
            Find answers to the most frequently asked questions
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        ref={faqRef.elementRef}
        className={`py-20 px-4 sm:px-6 lg:px-8 ${faqRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
      >
        <div className="max-w-4xl mx-auto">
          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="faq-search"
                name="faq_search"
                type="text"
                placeholder="Search for questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-[3px] border-slate-900 dark:border-white rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 ${selectedCategory === category
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-[3px] border-slate-900 dark:border-white hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border-4 border-slate-900 dark:border-white overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-black uppercase tracking-wider text-white bg-rose-500 px-2 py-1 rounded-lg border-[2px] border-slate-900">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{faq.question}</h3>
                    </div>
                    <div className="flex-shrink-0">
                      {openIndex === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-5 pt-0 border-t-[3px] border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800">
                      <p className="text-slate-700 dark:text-slate-400 leading-relaxed mt-4">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 text-center border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a]">
                <p className="text-slate-600 dark:text-slate-400 font-bold">No questions found matching your search. Try a different search term or category.</p>
              </div>
            )}
          </div>

          {/* Still Need Help Section */}
          <div className="mt-12 bg-white dark:bg-slate-900 rounded-[2rem] p-8 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] text-center">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">Still need help?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <a
              href="/contact"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-rose-500 text-white rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
            >
              <span className="font-bold">Contact Us</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}




