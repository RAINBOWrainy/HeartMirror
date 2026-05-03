/**
 * Two-phase migration system with resume capability
 * Handles schema and data migrations safely with progress tracking
 */
import { EncryptionError, EncryptionErrorCode } from './errors';

export type MigrationPhase = 'pending' | 'validating' | 'migrating' | 'cleanup' | 'complete' | 'failed';

export interface MigrationState {
  version: number;
  phase: MigrationPhase;
  currentCursor: string | null; // Last processed ID for resume
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface MigrationStep {
  version: number;
  name: string;
  description: string;
  up: (state: MigrationState, onProgress: (progress: number) => void) => Promise<void>;
  down?: () => Promise<void>; // Rollback
  validate: () => Promise<boolean>;
}

const MIGRATION_STATE_KEY = 'heartmirror_migration_state';

/**
 * Get current migration state from localStorage
 */
export function getMigrationState(): MigrationState | null {
  try {
    const stored = localStorage.getItem(MIGRATION_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save migration state to localStorage
 */
export function saveMigrationState(state: MigrationState): void {
  localStorage.setItem(MIGRATION_STATE_KEY, JSON.stringify(state));
}

/**
 * Clear migration state
 */
export function clearMigrationState(): void {
  localStorage.removeItem(MIGRATION_STATE_KEY);
}

/**
 * Check if a migration is in progress (needs resume)
 */
export function needsResume(): boolean {
  const state = getMigrationState();
  return state !== null && state.phase !== 'complete' && state.phase !== 'failed';
}

/**
 * Migration executor with two-phase commit
 * Phase 1: Validate all prerequisites, check all items
 * Phase 2: Execute migration with progress tracking and resume support
 */
export class MigrationExecutor {
  private steps: MigrationStep[] = [];
  private currentVersion: number = 0;

  registerStep(step: MigrationStep): void {
    this.steps.push(step);
    this.steps.sort((a, b) => a.version - b.version);
  }

  /**
   * Get the latest registered migration version
   */
  getLatestVersion(): number {
    return this.steps.length > 0 ? Math.max(...this.steps.map(s => s.version)) : 0;
  }

  /**
   * Resume a partially completed migration
   */
  async resume(onProgress: (progress: number, message: string) => void): Promise<void> {
    const state = getMigrationState();
    if (!state) {
      throw new EncryptionError(EncryptionErrorCode.INVALID_FORMAT, 'No migration to resume');
    }

    onProgress(state.progress, `Resuming migration from ${state.phase} phase`);

    const pendingSteps = this.steps.filter(s => s.version > state.version);

    for (const step of pendingSteps) {
      await this.executeStep(step, onProgress);
    }

    const finalState: MigrationState = {
      ...state,
      version: this.getLatestVersion(),
      phase: 'complete',
      progress: 100,
      completedAt: new Date().toISOString(),
    };
    saveMigrationState(finalState);
  }

  /**
   * Run all pending migrations
   */
  async runAll(onProgress: (progress: number, message: string) => void): Promise<void> {
    const existingState = getMigrationState();

    if (existingState && existingState.phase !== 'complete') {
      throw new EncryptionError(
        EncryptionErrorCode.MIGRATION_REQUIRED,
        'Migration already in progress. Use resume() to continue.'
      );
    }

    const startVersion = existingState?.version ?? 0;
    const pendingSteps = this.steps.filter(s => s.version > startVersion);

    if (pendingSteps.length === 0) {
      onProgress(100, 'No migrations needed');
      return;
    }

    const initialState: MigrationState = {
      version: startVersion,
      phase: 'pending',
      currentCursor: null,
      progress: 0,
      totalItems: pendingSteps.length,
      processedItems: 0,
      error: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    saveMigrationState(initialState);

    try {
      for (const step of pendingSteps) {
        await this.executeStep(step, onProgress);
      }

      const finalState: MigrationState = {
        ...initialState,
        version: this.getLatestVersion(),
        phase: 'complete',
        progress: 100,
        processedItems: pendingSteps.length,
        completedAt: new Date().toISOString(),
      };
      saveMigrationState(finalState);

      onProgress(100, 'Migration completed successfully');
    } catch (error) {
      const failedState: MigrationState = {
        ...getMigrationState()!,
        phase: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
      saveMigrationState(failedState);
      throw error;
    }
  }

  private async executeStep(
    step: MigrationStep,
    onProgress: (progress: number, message: string) => void
  ): Promise<void> {
    const state = getMigrationState()!;

    // Phase 1: Validation
    saveMigrationState({ ...state, phase: 'validating' });
    onProgress(state.progress, `Validating: ${step.name}`);

    const isValid = await step.validate();
    if (!isValid) {
      throw new Error(`Validation failed for migration ${step.version}: ${step.name}`);
    }

    // Phase 2: Execution
    saveMigrationState({ ...state, phase: 'migrating' });
    onProgress(state.progress, `Migrating: ${step.name}`);

    await step.up(state, (itemProgress) => {
      const overallProgress =
        (state.processedItems / state.totalItems) * 100 + (itemProgress / state.totalItems);
      saveMigrationState({
        ...state,
        progress: overallProgress,
      });
      onProgress(overallProgress, `Migrating: ${step.name}`);
    });

    saveMigrationState({
      ...state,
      version: step.version,
      processedItems: state.processedItems + 1,
    });
  }

  /**
   * Rollback last migration (if rollback available)
   */
  async rollback(): Promise<void> {
    const state = getMigrationState();
    if (!state) return;

    const lastStep = this.steps.find(s => s.version === state.version);
    if (lastStep?.down) {
      await lastStep.down();
      saveMigrationState({
        ...state,
        version: state.version - 1,
        phase: 'pending',
      });
    }
  }
}

// Singleton instance
export const migrationExecutor = new MigrationExecutor();
