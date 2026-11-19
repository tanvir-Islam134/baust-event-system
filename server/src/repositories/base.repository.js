import { db } from '../config/firebase.js';

/**
 * BaseRepository encapsulates Cloud Firestore document operations.
 * Controllers and Services should interact with Firestore through repositories
 * to maintain strict layer separation.
 */
export class BaseRepository {
  /**
   * @param {string} collectionName - Name of the Firestore collection
   */
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  /**
   * Returns the Firestore collection reference.
   * Throws if db is not initialized.
   */
  get collection() {
    if (!db) {
      throw new Error(`Firestore database is not initialized. Cannot access collection '${this.collectionName}'.`);
    }
    return db.collection(this.collectionName);
  }

  /**
   * Returns the database instance.
   */
  get db() {
    if (!db) {
      throw new Error('Firestore database is not initialized.');
    }
    return db;
  }

  /**
   * Get a document by its ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const docRef = this.collection.doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() };
  }

  /**
   * Find documents matching filters, with optional ordering and pagination.
   * @param {Array<[string, FirebaseFirestore.WhereFilterOp, any]>} filters
   * @param {{ orderBy?: [string, 'asc' | 'desc'], limit?: number, startAfter?: any }} [options]
   * @returns {Promise<Array<object>>}
   */
  async find(filters = [], options = {}) {
    let query = this.collection;
    for (const [field, op, val] of filters) {
      if (val !== undefined) {
        query = query.where(field, op, val);
      }
    }
    if (options.orderBy) {
      const [field, direction] = options.orderBy;
      query = query.orderBy(field, direction || 'asc');
    }
    if (options.startAfter) {
      query = query.startAfter(options.startAfter);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    try {
      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      // If Firestore reports a missing composite index (code 9 / FAILED_PRECONDITION),
      // gracefully fallback to executing without orderBy in Firestore and sort in-memory in Node.js
      const isIndexError =
        err.code === 9 ||
        (typeof err.message === 'string' && err.message.toLowerCase().includes('requires an index')) ||
        (typeof err.details === 'string' && err.details.toLowerCase().includes('requires an index'));

      if (options.orderBy && isIndexError) {
        console.warn(
          `[Firestore] Missing composite index for collection '${this.collectionName}'. Falling back to in-memory sorting.`
        );
        let fallbackQuery = this.collection;
        for (const [field, op, val] of filters) {
          if (val !== undefined) {
            fallbackQuery = fallbackQuery.where(field, op, val);
          }
        }
        const snapshot = await fallbackQuery.get();
        let docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const [field, direction] = options.orderBy;
        const dir = (direction || 'asc').toLowerCase();
        docs.sort((a, b) => {
          let valA = a[field];
          let valB = b[field];

          // Handle Date strings or Firestore timestamps
          if (valA?.toDate && typeof valA.toDate === 'function') valA = valA.toDate();
          if (valB?.toDate && typeof valB.toDate === 'function') valB = valB.toDate();
          if (typeof valA === 'string' && !isNaN(Date.parse(valA))) valA = new Date(valA);
          if (typeof valB === 'string' && !isNaN(Date.parse(valB))) valB = new Date(valB);

          if (valA == null && valB == null) return 0;
          if (valA == null) return dir === 'asc' ? 1 : -1;
          if (valB == null) return dir === 'asc' ? -1 : 1;
          if (valA < valB) return dir === 'asc' ? -1 : 1;
          if (valA > valB) return dir === 'asc' ? 1 : -1;
          return 0;
        });

        if (options.limit) {
          docs = docs.slice(0, options.limit);
        }
        return docs;
      }
      throw err;
    }
  }

  /**
   * Find all documents matching simple filters (alias to find without limit).
   * @param {Array<[string, FirebaseFirestore.WhereFilterOp, any]>} filters
   * @returns {Promise<Array<object>>}
   */
  async findAll(filters = []) {
    return this.find(filters);
  }

  /**
   * Create or overwrite a document.
   * @param {object} data - Document data
   * @param {string} [id=null] - Document ID (optional, auto-generated if omitted)
   * @returns {Promise<object>}
   */
  async create(data, id = null) {
    const timestamp = new Date();
    const payload = {
      ...data,
      createdAt: data.createdAt || timestamp,
      updatedAt: timestamp,
    };

    if (id) {
      const docRef = this.collection.doc(id);
      await docRef.set(payload);
      return { id, ...payload };
    }

    const docRef = await this.collection.add(payload);
    return { id: docRef.id, ...payload };
  }

  /**
   * Update an existing document.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object|null>}
   */
  async update(id, data) {
    const docRef = this.collection.doc(id);
    const payload = {
      ...data,
      updatedAt: new Date(),
    };
    await docRef.update(payload);
    return this.findById(id);
  }

  /**
   * Delete a document by ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    await this.collection.doc(id).delete();
    return true;
  }

  /**
   * Execute atomic transactions using Firestore runTransaction.
   * @param {function(FirebaseFirestore.Transaction): Promise<any>} updateFunction
   * @returns {Promise<any>}
   */
  async runTransaction(updateFunction) {
    return this.db.runTransaction(updateFunction);
  }
}
