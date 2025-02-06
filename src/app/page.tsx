'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { Bars3Icon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

type Language = {
  greeting: string;
  role: string;
  helpText: string;
  placeholder: string;
  actions: {
    project: string;
    hire: string;
    skills: string;
  };
  menu: {
    skills: string;
    blog: string;
    contact: string;
  };
};

const languages: Record<string, Language> = {
  en: {
    greeting: "Hi, I'm Rodrigo",
    role: "Software Developer / UX Engineer / Media Artist / Tech Mentor",
    helpText: "How can I help you?",
    placeholder: "Ask me anything...",
    actions: {
      project: "Need help with a project?",
      hire: "Hire me",
      skills: "Check my skills"
    },
    menu: {
      skills: "Skills",
      blog: "Blog",
      contact: "Contact"
    }
  },
  es: {
    greeting: "Hola, soy Rodrigo",
    role: "Desarrollador Software / Ingeniero UX  / Artista de medios / Mentor Tecnológico",
    helpText: "¿Cómo puedo ayudarte?",
    placeholder: "Pregúntame lo que quieras...",
    actions: {
      project: "¿Necesitas ayuda con un proyecto?",
      hire: "Contrátame",
      skills: "Ver mis habilidades"
    },
    menu: {
      skills: "Habilidades",
      blog: "Blog",
      contact: "Contacto"
    }
  },
  de: {
    greeting: "Hi, ich bin Rodrigo",
    role: "Software Entwickler / UX Engineer / Medienkünstler / Tech-Mentor",
    helpText: "Wie kann ich dir helfen?",
    placeholder: "Frag mich etwas...",
    actions: {
      project: "Brauchst du Hilfe bei einem Projekt?",
      hire: "Hire mich",
      skills: "Meine Fähigkeiten"
    },
    menu: {
      skills: "Fähigkeiten",
      blog: "Blog",
      contact: "Kontakt"
    }
  }
};

const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch'
};

export default function Home() {
  const [currentLang, setCurrentLang] = useState('en');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = languages[currentLang as keyof typeof languages];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-800 relative">
      {/* Animated background */}
      <motion.div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 30% 20%, #f5f5f5 0%, transparent 70%)',
            'radial-gradient(circle at 70% 60%, #f5f5f5 0%, transparent 70%)',
            'radial-gradient(circle at 40% 80%, #f5f5f5 0%, transparent 70%)',
            'radial-gradient(circle at 30% 20%, #f5f5f5 0%, transparent 70%)',
          ],
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity, 
          ease: "linear",
          times: [0, 0.33, 0.66, 1]
        }}
      />

      {/* Header with responsive navigation */}
      <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Desktop menu */}
          <nav className="hidden lg:block">
            {/* <ul className="flex gap-6 text-sm">
              {Object.entries(t.menu).map(([key, value]) => (
                <li key={key}>
                  <a href={`#${key}`} className="hover:text-blue-500 transition-colors">
                    {value as string}
                  </a>
                </li>
              ))}
            </ul> */}
          </nav>

          {/* Language toggle - desktop */}
          <HeadlessMenu as="div" className="relative">
            <button className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              {languageNames[currentLang]}
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <div className="absolute right-0 mt-2 w-36 rounded-lg bg-white shadow-lg border border-gray-100 focus:outline-none">
                {['en', 'es', 'de'].map((lang) => (
                  <HeadlessMenu.Item key={lang}>
                    {({ active }) => (
                      <button
                        onClick={() => setCurrentLang(lang)}
                        className={`${
                          active ? 'bg-gray-50' : ''
                        } ${
                          currentLang === lang ? 'font-medium' : ''
                        } group flex w-full items-center justify-between px-4 py-2 text-sm`}
                      >
                        {languageNames[lang]}
                        {currentLang === lang && (
                          <CheckIcon className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </HeadlessMenu.Item>
                ))}
              </div>
            </Transition>
          </HeadlessMenu>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden ${
            isMobileMenuOpen ? 'block' : 'hidden'
          } bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm`}
        >
          <nav className="container mx-auto px-4 py-4">
            <ul className="space-y-4">
              {Object.entries(t.menu).map(([key, value]) => (
                <li key={key}>
                  <a
                    href={`#${key}`}
                    className="block py-2 hover:text-blue-500 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {value as string}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-2xl min-h-screen flex flex-col items-center justify-center px-4 md:px-6 space-y-8 relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 px-4"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{t.greeting}</h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {t.role}
          </p>
          {/* <p className="text-lg md:text-xl mt-2">{t.helpText}</p> */}
        </motion.div>

        {/* Input field */}
        {/* <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-xl px-4"
        >
          <input
            type="text"
            placeholder={t.placeholder}
            className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white/50 border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-base md:text-lg"
          />
        </motion.div> */}

        {/* Action buttons */}
        {/* <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center px-4"
        >
          {Object.entries(t.actions).map(([key, value]) => (
            <button
              key={key}
              className="px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-white/50 border border-gray-200 hover:bg-gray-800 hover:text-white transition-all text-sm md:text-base whitespace-nowrap"
            >
              {value as string}
            </button>
          ))}
        </motion.div> */}
      </main>
    </div>
  );
}