import ResourceCard from "@/components/resources/ResourceCard";

// Mock data for MVP
const mockResources = [
  {
    id: "1",
    title: "React Hooks",
    description: "Learn the basics of React Hooks and state management.",
    type: "ARTICLE",
    category: "Programming",
    tags: ["React", "Hooks", "Frontend"],
    thumbnail: "https://via.placeholder.com/400x200",
  },
  {
    id: "2",
    title: "JavaScript Closures",
    description: "Understand closures in JavaScript with examples.",
    type: "ARTICLE",
    category: "Programming",
    tags: ["JavaScript", "Closures"],
    thumbnail: "https://via.placeholder.com/400x200",
  },
];

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">All Resources</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockResources.map((resource) => (
          <ResourceCard key={resource.id} {...resource} />
        ))}
      </div>
    </div>
  );
}
