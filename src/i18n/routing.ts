import {createNavigation} from 'next-intl/navigation';
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  pathnames: {
    '/': '/',
    '/skills': {
      en: '/skills',
      es: '/habilidades'
    },
    '/projects': {
      en: '/projects',
      es: '/proyectos'
    },
    '/contact': {
      en: '/contact',
      es: '/contacto'
    }
  }
});

export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];

export const {Link, getPathname, redirect, usePathname, useRouter} =
  createNavigation(routing);