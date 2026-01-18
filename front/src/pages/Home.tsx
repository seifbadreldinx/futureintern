import { Hero } from '../components/Hero';
import { FeaturedOpportunities } from '../components/FeaturedOpportunities';
import { HowItWorks } from '../components/HowItWorks';
// import { Testimonials } from '../components/Testimonials';

export function Home() {
  return (
    <>
      <Hero />
      <FeaturedOpportunities />
      <HowItWorks />
      {/* <Testimonials /> - Hidden until we have real ones */}
    </>
  );
}

