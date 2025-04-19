'use client';

import {useTranslations} from 'next-intl';
import HomeLayout from '@/components/layout/HomeLayout';

export default function ExperiencePage() {
  const t = useTranslations('experience');

  return (
    <HomeLayout>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            {t('title')}
          </h1>
        </div>

        {/* Summary Section */}
        <div className="rounded-lg bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">{t('summary.title')}</h2>
          <p className="text-gray-400">{t('summary.description')}</p>
        </div>

        {/* Philosophy Section */}
        <div className="rounded-lg bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">{t('philosophy.title')}</h2>
          <p className="text-gray-400">{t('philosophy.description')}</p>
        </div>

        {/* Key Projects Section */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold text-white">{t('keyProjects.title')}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {t.raw('keyProjects.categories').map((category: any) => (
              <div key={category.title} className="rounded-lg bg-slate-800 p-6">
                <h3 className="mb-4 text-xl font-semibold text-white">{category.title}</h3>
                <div className="space-y-6">
                  {category.projects.map((project: any) => (
                    <div key={project.title}>
                      <h4 className="text-lg font-medium text-white">{project.title}</h4>
                      <p className="mt-2 text-gray-400">{project.achievement}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.technologies.map((tech: string) => (
                          <span key={tech} className="rounded-full bg-slate-700 px-3 py-1 text-sm text-gray-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Science + Art + Tech Section */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold text-white">{t('scienceArtTech.title')}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {t.raw('scienceArtTech.highlights').map((highlight: any) => (
              <div key={highlight.title} className="rounded-lg bg-slate-800 p-6">
                <h3 className="mb-2 text-lg font-medium text-white">{highlight.title}</h3>
                <p className="text-gray-400">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}