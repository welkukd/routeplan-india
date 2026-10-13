import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const gupshupKey = process.env.GUPSHUP_API_KEY;
  const razorpayKey = process.env.RAZORPAY_KEY_ID;

  const database = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')
    ? 'configured'
    : 'not_configured';
  const whatsapp = gupshupKey && !gupshupKey.includes('your-') ? 'configured' : 'not_configured';
  const payments = razorpayKey && !razorpayKey.includes('your-') ? 'configured' : 'not_configured';

  return NextResponse.json({
    status: 'healthy',
    database,
    whatsapp,
    payments,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'routeplan-api',
  });
}
