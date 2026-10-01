import { Suspense } from "react";
import TaskPageClient from "@/components/task-page-client";

export default function TaskPage() {
  return <Suspense fallback={<main className="app-shell"><div className="loading-state" role="status">Відкриваю дію…</div></main>}><TaskPageClient /></Suspense>;
}
