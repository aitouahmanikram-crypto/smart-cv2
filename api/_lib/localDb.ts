import fs from 'fs';
import path from 'path';

const FALLBACK_FILE_PATH = path.join('/tmp', 'fallback_db.json');

interface FallbackSchema {
  career_advice: any[];
  cv_versions: any[];
  [key: string]: any[];
}

function initDb(): FallbackSchema {
  try {
    if (!fs.existsSync(FALLBACK_FILE_PATH)) {
      const initial: FallbackSchema = {
        career_advice: [],
        cv_versions: []
      };
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const data = fs.readFileSync(FALLBACK_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error initializing fallback DB:', err);
    return {
      career_advice: [],
      cv_versions: []
    };
  }
}

function saveDb(db: FallbackSchema) {
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving fallback DB:', err);
  }
}

export const localDb = {
  get: (table: string, filter?: (item: any) => boolean): any[] => {
    const db = initDb();
    const list = db[table] || [];
    if (filter) {
      return list.filter(filter);
    }
    return list;
  },

  getOne: (table: string, filter: (item: any) => boolean): any | null => {
    const db = initDb();
    const list = db[table] || [];
    return list.find(filter) || null;
  },

  insert: (table: string, item: any): any => {
    const db = initDb();
    if (!db[table]) {
      db[table] = [];
    }
    db[table].push(item);
    saveDb(db);
    return item;
  },

  insertMany: (table: string, items: any[]): any[] => {
    const db = initDb();
    if (!db[table]) {
      db[table] = [];
    }
    db[table].push(...items);
    saveDb(db);
    return items;
  },

  update: (table: string, filter: (item: any) => boolean, updates: any): any[] => {
    const db = initDb();
    const list = db[table] || [];
    let updated: any[] = [];
    db[table] = list.map(item => {
      if (filter(item)) {
        const newItem = { ...item, ...updates };
        updated.push(newItem);
        return newItem;
      }
      return item;
    });
    saveDb(db);
    return updated;
  },

  delete: (table: string, filter: (item: any) => boolean) => {
    const db = initDb();
    const list = db[table] || [];
    db[table] = list.filter(item => !filter(item));
    saveDb(db);
  }
};
