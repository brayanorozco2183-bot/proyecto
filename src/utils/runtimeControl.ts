import { ABORT_ERROR } from '../agents/base.js';
import { dbManager } from '../db/index.js';

/**
 * Runtime Control System.
 * Manages signals to stop or pause specific missions.
 */
export class RuntimeControl {
    private static globalStopSignal = false;
    private static missionSignals: Map<string, { stopSignal: boolean, controller: AbortController }> = new Map();

    /**
     * Sets the global stop signal and aborts all active controllers.
     */
    static stopAll() {
        console.warn('🛑 GLOBAL STOP SIGNAL ACTIVATED');
        this.globalStopSignal = true;
        for (const state of this.missionSignals.values()) {
            state.stopSignal = true;
            try { state.controller.abort(); } catch {}
        }
    }

    /**
     * Returns the abort signal for a specific mission.
     */
    static getSignal(missionId?: string): AbortSignal | undefined {
        if (!missionId) return undefined;
        return this.missionSignals.get(missionId)?.controller.signal;
    }

    /**
     * Initializes the abort controller for a new mission.
     */
    static setActiveMission(missionId: string) {
        if (this.missionSignals.has(missionId)) {
            try { this.missionSignals.get(missionId)!.controller.abort(); } catch {}
        }
        this.missionSignals.set(missionId, { stopSignal: false, controller: new AbortController() });
    }

    static stopMission(missionId: string) {
        const state = this.missionSignals.get(missionId);
        if (state) {
            state.stopSignal = true;
            try { state.controller.abort(); } catch {}
        }
    }

    /**
     * Resets the global stop signal.
     */
    static reset() {
        this.globalStopSignal = false;
    }

    /**
     * Checks if the stop signal is active for the given mission.
     * Throws an error to immediately abort the current execution path.
     */
    static async check(missionId?: string) {
        if (this.globalStopSignal) {
            throw new Error(ABORT_ERROR);
        }

        if (missionId) {
            const state = this.missionSignals.get(missionId);
            if (state && state.stopSignal) {
                throw new Error(ABORT_ERROR);
            }

            try {
                const db = await dbManager.getDB();
                const mission = await db.get('SELECT status FROM missions WHERE id = ?', [missionId]);
                if (mission?.status === 'STOPPED') {
                    this.stopMission(missionId);
                    throw new Error(ABORT_ERROR);
                }
            } catch (e: any) {
                if (e.message === ABORT_ERROR) throw e;
                // Ignore DB errors during check
            }
        }
    }

    /**
     * Synchronous check for non-async contexts.
     */
    static checkSync(missionId?: string) {
        if (this.globalStopSignal) {
            throw new Error(ABORT_ERROR);
        }
        if (missionId) {
            const state = this.missionSignals.get(missionId);
            if (state && state.stopSignal) {
                throw new Error(ABORT_ERROR);
            }
        }
    }

    static isStopped(missionId?: string): boolean {
        if (this.globalStopSignal) return true;
        if (!missionId) return false;
        const state = this.missionSignals.get(missionId);
        return state ? state.stopSignal : false;
    }
}
