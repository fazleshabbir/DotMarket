import { redirect } from 'next/navigation';

export default function DocsIndexPage() {
  redirect('/docs/user-guide/introduction');
}
