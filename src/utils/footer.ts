import type { FooterContactItem, FooterLegalLink, FooterQuickLink } from '@/types/footer'

export const footerCurrentYear: number = new Date().getFullYear()

export const footerBrandName = 'BizNest'

export const footerBrandDescription =
  'A location intelligence platform that helps founders pick the right place, launch with confidence, and grow with local insights.'

export const footerQuickLinks: FooterQuickLink[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Get Started', to: '/login' },
]

export const footerLegalLinks: FooterLegalLink[] = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Preferences', href: '#' },
]

export const footerContactItems: FooterContactItem[] = [
  { label: 'hello@biznest.app', icon: 'mail', href: 'mailto:hello@biznest.app' },
  { label: 'Remote-first team, serving local entrepreneurs globally', icon: 'map-pin' },
  { label: 'Mon to Fri, 9:00 AM to 6:00 PM', icon: 'clock-3' },
]
