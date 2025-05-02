"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useLocale } from "next-intl";

type FormData = {
  username: string;
  password: string;
};

export default function Login() {
  const [error, setError] = useState('');
  const { register, handleSubmit } = useForm<FormData>();

  const router = useRouter();
  const locale = useLocale();

  
  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        setError('Invalid credentials');
        return;
      }

      const { token } = await res.json();
      console.log('Login successful, token:', token);
    
      
      router.push(`/${locale}/services/images/demo`);

      
    } catch {
      setError('An error occurred');
    }
  };

  return (
    <div className="p-4 w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-2">Username</label>
          <input
            {...register('username', { required: true })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2">Password</label>
          <input
            type="password"
            {...register('password', { required: true })}
            className="w-full p-2 border rounded"
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <footer className="flex gap-2 justify-center">
          <Button
            type="submit"
          >
            Login
          </Button>
          <Button variant="outline">
            Cancel
          </Button>
        </footer>
      </form>
    </div>
  );
}