import { publicFilesDir, serveFile } from '@/lib/serve-static';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const root = publicFilesDir('patch');
  const { path: segments } = await params;
  return serveFile(root, segments);
}
