import Link from "next/link";

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">ArcBase</h1>

      <div className="mt-6">
        <Link href="/resources">View Resources</Link>
      </div>
    </main>
  );
}
