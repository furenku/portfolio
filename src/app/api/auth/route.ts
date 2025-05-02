import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    // In production, use environment variables and secure password hashing
    const VALID_PASSWORD = 'abc';
    
    if (password !== VALID_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        username,
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { algorithm: 'HS256' }
    );

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}