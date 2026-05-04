import { ABORT_ERROR } from '../agents/base.js';

/**
 * Global Runtime Control System.
 * Centralizes signals to stop or pause the entire agent swarm.
 */
export class RuntimeControl {
    private static stopSignal = false;

    /**
     * Sets the global stop signal.
     */
    static stopAll() {
        console.warn('🛑 GLOBAL STOP SIGNAL ACTIVATED');
        this.stopSignal = true;
    }

    /**
     * Resets the stop signal for new missions.
     */
    static reset() {
        this.stopSignal = false;
    }

    /**
     * Checks if the stop signal is active.
     * Throws an error to immediately abort the current execution path.
     */
    static check() {
        if (this.stopSignal) {
            throw new Error(ABORT_ERROR);
        }
    }

    static isStopped(): boolean {
        return this.stopSignal;
    }
}
