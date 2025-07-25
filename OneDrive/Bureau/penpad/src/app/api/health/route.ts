import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'PennPad API is working!',
    timestamp: new Date().toISOString()
  })
} 