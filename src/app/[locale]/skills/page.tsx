'use client';

import {useTranslations} from 'next-intl';
import HomeLayout from '@/components/layout/HomeLayout';

export default function SkillsPage() {
  const t = useTranslations('skills');

  return (
    <HomeLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-[590px]">
            {t('description')}
          </p>
        </div>


        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {t.raw('items').map((category: any) => (
            <div key={category.title} className="rounded-lg bg-slate-800 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">{category.title}</h2>
              <div className="space-y-4">
                {category.items.map((item: any) => (
                  <div key={item.title}>
                    <h3 className="text-lg font-medium text-white">{item.title}</h3>
                    <p className="mt-1 text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </HomeLayout>
  );
} 