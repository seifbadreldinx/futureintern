export interface Internship {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Remote';
  logo: string;
}

export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  avatar: string;
}
