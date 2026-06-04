import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';
import { find } from '@/lib/data';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = find(slug);
  return { title: product ? product.name : 'Product' };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = find(slug);
  return (
    <Placeholder
      title={product ? product.name : 'Product'}
      icon="pkg"
      heading={product ? `${product.name} · ${product.unit}` : 'Product coming soon'}
      sub="The product detail page — gallery, highlights, and related items — arrives in Sprint 1."
    />
  );
}
