"use client";

import { useSearchParams } from "next/navigation";
import TaskDetail from "./task-detail";

export default function TaskPageClient() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  return <TaskDetail key={id} id={id} />;
}
