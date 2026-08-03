import { mongodb } from '../../db/mongodb';
import { logger } from '../../config/logger';

export interface CheckpointRecord {
  sessionId: string;
  checkpointId: string;
  step: number;
  state: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'paused' | 'failed';
  requiresApproval?: boolean;
  approvalData?: {
    action: string;
    amount?: number;
    description: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class MongoDBSaver {
  private static collectionName = 'langgraph_checkpoints';
  private static memoryStore = new Map<string, CheckpointRecord>();

  private static getCollection() {
    try {
      const db = mongodb.getDb();
      return db ? db.collection<CheckpointRecord>(this.collectionName) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save or update a checkpoint state in MongoDB (with memory store fallback)
   */
  static async saveCheckpoint(
    sessionId: string,
    step: number,
    state: Record<string, any>,
    status: 'pending' | 'running' | 'completed' | 'paused' | 'failed' = 'running',
    requiresApproval = false,
    approvalData?: CheckpointRecord['approvalData']
  ): Promise<string> {
    const checkpointId = `chk_${sessionId}_${step}_${Date.now()}`;
    const record: CheckpointRecord = {
      sessionId,
      checkpointId,
      step,
      state,
      status,
      requiresApproval,
      approvalData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Always update memory store fallback
    this.memoryStore.set(sessionId, record);

    try {
      const collection = this.getCollection();
      if (collection) {
        await collection.updateOne(
          { sessionId },
          { $set: record },
          { upsert: true }
        );
      }
      logger.info({ sessionId, step, status }, 'Saved LangGraph checkpoint');
    } catch (error) {
      logger.warn({ error, sessionId }, 'MongoDB checkpoint save failed, using memory store');
    }

    return checkpointId;
  }

  /**
   * Retrieve active checkpoint for a session
   */
  static async getCheckpoint(sessionId: string): Promise<CheckpointRecord | null> {
    try {
      const collection = this.getCollection();
      if (collection) {
        const found = await collection.findOne({ sessionId });
        if (found) return found;
      }
    } catch {
      // Fallback
    }

    return this.memoryStore.get(sessionId) || null;
  }

  /**
   * List all paused checkpoints awaiting human approval
   */
  static async getPendingApprovals(): Promise<CheckpointRecord[]> {
    try {
      const collection = this.getCollection();
      if (collection) {
        const list = await collection.find({ status: 'paused', requiresApproval: true }).toArray();
        if (list.length > 0) return list;
      }
    } catch {
      // Fallback
    }

    return Array.from(this.memoryStore.values()).filter(
      r => r.status === 'paused' && r.requiresApproval
    );
  }

  /**
   * Approve and resume a paused checkpoint
   */
  static async approveCheckpoint(sessionId: string): Promise<CheckpointRecord | null> {
    const record = await this.getCheckpoint(sessionId);
    if (!record || record.status !== 'paused') return null;

    record.status = 'running';
    record.requiresApproval = false;
    record.updatedAt = new Date();

    this.memoryStore.set(sessionId, record);

    try {
      const collection = this.getCollection();
      if (collection) {
        await collection.updateOne(
          { sessionId },
          {
            $set: {
              status: 'running',
              requiresApproval: false,
              updatedAt: new Date()
            }
          }
        );
      }
    } catch {
      // Fallback
    }

    return record;
  }
}
