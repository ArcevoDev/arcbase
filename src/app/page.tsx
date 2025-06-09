import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to NexaShelf ⚡</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Built by <strong>KennyGr8</strong> — combining poetry and code.
      </p>
      <div className="flex gap-4">
        <Link href="/projects">
          <Button variant="default">View Projects</Button>
        </Link>
        <Link href="/den-of-poems">
          <Button variant="outline">Read Poems</Button>
        </Link>
      </div>
    </main>
  );
}
