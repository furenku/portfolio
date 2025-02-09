'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import LanguageSelector from '@/components/LanguageSelector';

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';
 

export default function Home() {
  
  const [currentLang, setCurrentLang] = useState('en');
  
  const t = useTranslations('home');

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
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <nav className="flex flex-col gap-4">                
                {/* {Object.entries(t.menu).map(([key, value]) => (
                  <a
                    key={key}
                    href={`#${key}`}
                    className="block py-2 hover:text-blue-500 transition-colors"
                  >
                    {value as string}
                  </a>
                ))} */}
              </nav>
            </SheetContent>
          </Sheet>

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

          <LanguageSelector 
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-2xl min-h-screen flex flex-col items-center justify-center px-4 md:px-6 space-y-8 relative z-10 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLang}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-4 px-4"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{t('greeting')}</h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              {/* {t.role} */}              
            </p>
          </motion.div>
        </AnimatePresence>

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