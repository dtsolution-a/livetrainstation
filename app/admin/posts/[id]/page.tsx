'use client';

import { use } from 'react';
import PostEditor from '@/components/admin/PostEditor';

export default function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PostEditor key={id} id={id} />;
}
