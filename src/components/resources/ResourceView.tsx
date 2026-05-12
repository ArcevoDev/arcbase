"use client";

import { Badge } from "@/components/ui/badge";

interface ResourceViewProps {
  title: string;
  description?: string;
  content?: string;
  type: string;
  category?: string;
  tags?: string[];
  createdAt?: string;
}

export default function ResourceView({
  title,
  description,
  content,
  type,
  category,
  tags = [],
  createdAt,
}: ResourceViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex flex-wrap gap-2">
        {category && <Badge variant="secondary">{category}</Badge>}
        {tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
        <Badge variant="outline">{type}</Badge>
      </div>
      {description && <p className="text-muted-foreground">{description}</p>}
      {createdAt && (
        <p className="text-xs text-muted-foreground">Created: {createdAt}</p>
      )}
      {content && (
        <div className="prose max-w-full">
          <pre className="whitespace-pre-wrap">{content}</pre>
        </div>
      )}
    </div>
  );
}
