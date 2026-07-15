import React from 'react';
import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';
import { MDXComponents } from '@/components/docs/mdx/MDXComponents';

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export const dynamicParams = false;

export default async function DocsPage({ params }: PageProps) {
  // Await the params object before accessing properties
  const { category, slug } = await params;
  
  const contentDir = path.join(process.cwd(), 'content', 'docs', category);
  const filePath = path.join(contentDir, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { content, data: frontmatter } = matter(fileContent);

  return (
    <article className="docs-content" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 300, 
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: '-0.02em',
          marginBottom: '16px'
        }}>
          {frontmatter.title}
        </h1>
        {frontmatter.description && (
          <p style={{ 
            fontSize: '18px', 
            color: 'rgba(255,255,255,0.6)', 
            lineHeight: 1.6 
          }}>
            {frontmatter.description}
          </p>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontSize: '16px',
        lineHeight: 1.7,
        color: 'rgba(255,255,255,0.85)'
      }}>
        <MDXRemote source={content} components={MDXComponents} />
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  const categories = ['user-guide', 'protocol', 'developers', 'community'];
  const paramsList: { category: string; slug: string }[] = [];

  for (const cat of categories) {
    const dirPath = path.join(process.cwd(), 'content', 'docs', cat);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith('.mdx')) {
          paramsList.push({
            category: cat,
            slug: file.replace('.mdx', ''),
          });
        }
      }
    }
  }

  return paramsList;
}

