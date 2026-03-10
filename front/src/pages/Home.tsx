import { Hero } from '../components/Hero';
import { FeaturedOpportunities } from '../components/FeaturedOpportunities';
import { HowItWorks } from '../components/HowItWorks';
import { WhyFutureIntern } from '../components/WhyFutureIntern';
import { ResourceHub } from '../components/ResourceHub';
// import { Testimonials } from '../components/Testimonials';

export function Home() {
  return (
    <div className="friendly-unified-bg">
      <Hero />
      <WhyFutureIntern />
      <HowItWorks />
      <FeaturedOpportunities />
      <ResourceHub />
      {/* <Testimonials /> - Hidden until we have real ones */}
    </div>
  );
}
