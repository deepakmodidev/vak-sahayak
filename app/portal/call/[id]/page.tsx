import { CallResult } from '@/components/app/call-result';

export default async function CallResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CallResult submissionId={id} />;
}
