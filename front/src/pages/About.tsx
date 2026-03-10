import { useScrollReveal } from '../hooks/useScrollReveal';
import { Target, Users, Zap, Award, TrendingUp, Heart } from 'lucide-react';

export function About() {
  const missionRef = useScrollReveal();
  const valuesRef = useScrollReveal();
  const statsRef = useScrollReveal();
  const teamRef = useScrollReveal();

  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To bridge the gap between talented students and leading companies, creating meaningful internship opportunities that launch careers.',
    },
    {
      icon: Users,
      title: 'Student-Focused',
      description: 'We prioritize the needs and aspirations of students, ensuring every opportunity aligns with their career goals.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Leveraging cutting-edge technology to streamline the internship search and application process.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Maintaining the highest standards in connecting students with quality internship opportunities.',
    },
  ];

  const stats = [
    { number: '10,000+', label: 'Active Students' },
    { number: '500+', label: 'Partner Companies' },
    { number: '5,000+', label: 'Internships Posted' },
    { number: '95%', label: 'Success Rate' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-white dark:bg-slate-950"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1 bg-amber-400 text-slate-900 text-xs font-black uppercase tracking-wider rounded-full border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] mb-6">ABOUT US</div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-6 animate-fade-in-up">
            About <span className="text-rose-500">FutureIntern</span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 mb-8 animate-fade-in-up animation-delay-200 font-medium">
            Empowering the next generation of professionals
          </p>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
            We're on a mission to revolutionize how students discover and secure internships, 
            making career opportunities accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section
        ref={missionRef.elementRef}
        className={`py-20 px-4 sm:px-6 lg:px-8 ${missionRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                <p>
                  FutureIntern was born from a simple observation: finding the right internship 
                  shouldn't be a struggle. We saw talented students spending countless hours 
                  searching through fragmented job boards, while companies struggled to find 
                  qualified candidates.
                </p>
                <p>
                  Today, we've built a platform that brings students and companies together in 
                  a seamless, efficient way. Our technology matches the right opportunities 
                  with the right candidates, making the internship search process faster, 
                  smarter, and more successful.
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center flex-shrink-0 border-[3px] border-slate-900">
                    <TrendingUp className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white mb-2">Growth</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      We've grown from a small startup to a trusted platform serving thousands of students.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0 border-[3px] border-slate-900">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white mb-2">Passion</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      We're passionate about helping students achieve their career dreams.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section
        ref={valuesRef.elementRef}
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 ${valuesRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">Our Values</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_#0f172a] transition-all"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 border-[3px] border-slate-900">
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{value.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        ref={statsRef.elementRef}
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 ${statsRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">By The Numbers</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
              Our impact in numbers
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center bg-white dark:bg-slate-800 rounded-[2rem] p-8 border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section
        ref={teamRef.elementRef}
        className={`py-20 px-4 sm:px-6 lg:px-8 ${teamRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">Join Our Community</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Whether you're a student looking for opportunities or a company seeking talent, 
              we're here to help you succeed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">For Students</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Discover internships that match your skills and interests. Our platform makes 
                it easy to find, apply, and track your applications all in one place.
              </p>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                <li className="flex items-start">
                  <span className="text-rose-500 mr-2 font-bold">✓</span>
                </li>
                <li className="flex items-start">
                  <span className="text-rose-500 mr-2 font-bold">✓</span>
                  <span>Personalized recommendations based on your profile</span>
                </li>
                <li className="flex items-start">
                  <span className="text-rose-500 mr-2 font-bold">✓</span>
                  <span>Easy application tracking and management</span>
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">For Companies</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Connect with motivated, talented students who are ready to contribute to your team. 
                Post internships and find the perfect candidates quickly.
              </p>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Streamlined application management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Dedicated support for your hiring needs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

