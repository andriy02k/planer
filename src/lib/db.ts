export type Subtask = { id: string; title: string; done: boolean };
export type Task = {
  id: string;
  date: string;
  title: string;
  description: string;
  done: boolean;
  subtasks: Subtask[];
  createdAt: number;
};

export function isTaskDone(task: Task): boolean {
  return task.subtasks.length > 0 ? task.subtasks.every((subtask) => subtask.done) : task.done;
}

let connection: Promise<IDBDatabase> | undefined;

function database(): Promise<IDBDatabase> {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(new Error("Браузер не підтримує локальне збереження."));
        return;
      }
      const request = indexedDB.open("day-plan", 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("tasks", { keyPath: "id" });
        store.createIndex("date", "date");
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); connection = undefined; };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Закрий інші вкладки застосунку й спробуй ще раз."));
    }).catch((error) => { connection = undefined; throw error; });
  }
  return connection;
}

async function transact<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("tasks", mode);
    const request = operation(tx.objectStore("tasks"));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error || request.error);
    tx.onabort = () => reject(tx.error || new Error("Не вдалося зберегти зміни."));
  });
}

export async function getTasks(date: string): Promise<Task[]> {
  const tasks = await transact<Task[]>("readonly", (store) => store.index("date").getAll(date));
  return tasks.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export function getTask(id: string): Promise<Task | undefined> {
  return transact("readonly", (store) => store.get(id));
}

export async function saveTask(task: Task): Promise<void> {
  await transact("readwrite", (store) => store.put({ ...task, done: isTaskDone(task) }));
}

export async function deleteTask(id: string): Promise<void> {
  await transact("readwrite", (store) => store.delete(id));
}

export function newTask(title: string, date: string, description = ""): Task {
  return { id: crypto.randomUUID(), title: title.trim(), date, description: description.trim(), done: false, subtasks: [], createdAt: Date.now() };
}
