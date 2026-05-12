"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ResourceCardProps {
  id: string;
  title: string;
  description?: string;
  type: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
}

export default function ResourceCard({
  id,
  title,
  description,
  type,
  category,
  tags = [],
  thumbnail,
}: ResourceCardProps) {
  return (
    <Link
      href={`/resources/${id}`}
      className="border rounded-md p-4 flex flex-col hover:shadow-md transition"
    >
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-32 object-cover rounded-md mb-2"
        />
      )}
      <h2 className="font-semibold text-lg mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {category && <Badge variant="secondary">{category}</Badge>}
        {tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
        <Badge variant="outline">{type}</Badge>
      </div>
    </Link>
  );
}
