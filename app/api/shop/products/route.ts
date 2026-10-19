import { NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';

export async function GET() {
  try {
    return NextResponse.json({ success: true, products: await MuDatabase.getWebShopProducts() });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

