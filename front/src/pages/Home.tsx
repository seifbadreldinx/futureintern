import { Hero } from '../components/Hero';
import { FeaturedOpportunities } from '../components/FeaturedOpportunities';
import { HowItWorks } from '../components/HowItWorks';
import { Testimonials } from '../components/Testimonials';
import { WhyFutureIntern } from '../components/WhyFutureIntern';
import { ResourceHub } from '../components/ResourceHub';

export function Home() {
  return (
    <div className="friendly-unified-bg">
      <Hero />
      <HowItWorks />
      <FeaturedOpportunities />
      <WhyFutureIntern />
      <ResourceHub />
      <Testimonials />
    </div>
  );
}
