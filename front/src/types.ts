export interface Internship {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Remote' | 'Hybrid';
  category?: string;
  logo: string;
  logo_url?: string;
}

export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  avatar: string;
}
