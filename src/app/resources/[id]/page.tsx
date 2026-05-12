"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ResourceView from "@/components/resources/ResourceView";

// Mock data for demonstration
const mockResources = [
  {
    id: "1",
    title: "React Hooks",
    description: "Learn the basics of React Hooks and state management.",
    content: `### React Hooks Basics

Hooks let you use state and other React features without writing a class.

\`\`\`js
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
\`\`\`
`,
    type: "ARTICLE",
    category: "Programming",
    tags: ["React", "Hooks", "Frontend"],
    createdAt: "2026-03-13",
  },
  {
    id: "2",
    title: "JavaScript Closures",
    description: "Understand closures in JavaScript with examples.",
    content: `A closure is the combination of a function and the lexical environment within which that function was declared.

\`\`\`js
function outer() {
  let count = 0;
  return function inner() {
    count++;
    return count;
  }
}
const counter = outer();
console.log(counter()); // 1
console.log(counter()); // 2
\`\`\`
`,
    type: "ARTICLE",
    category: "Programming",
    tags: ["JavaScript", "Closures"],
    createdAt: "2026-03-12",
  },
];

export default function ResourcePage() {
  const params = useParams();
  const [resource, setResource] = useState<(typeof mockResources)[0] | null>(
    null,
  );

  useEffect(() => {
    const found = mockResources.find((r) => r.id === params.id);
    setResource(found || null);
  }, [params.id]);

  if (!resource) {
    return <p className="text-center py-10">Resource not found.</p>;
  }

  return <ResourceView {...resource} />;
}
