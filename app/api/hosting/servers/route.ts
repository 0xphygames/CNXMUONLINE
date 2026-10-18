import { NextResponse } from 'next/server';
import { streetHosting } from '@/lib/streethosting';

export async function GET() {
  try {
    return NextResponse.json(await streetHosting.servers());
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 502 }
    );
  }
}
