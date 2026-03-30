import { openDB } from 'https://unpkg.com/idb?module';

const DB_NAME = 'besmos-graphs-db';
const DB_VERSION = 1;
const STORE_NAME = 'graphs';

export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('lastModified', 'lastModified');
            }
        },
    });
}

export async function saveGraph(graph) {
    const db = await initDB();
    graph.lastModified = Date.now();
    await db.put(STORE_NAME, graph);
}

export async function getGraph(id) {
    const db = await initDB();
    return db.get(STORE_NAME, id);
}

export async function getAllGraphs() {
    const db = await initDB();
    return db.getAllFromIndex(STORE_NAME, 'lastModified');
}

export async function deleteGraph(id) {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
}
