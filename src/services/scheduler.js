/**
 * Task Scheduler Service
 * Manages scheduled tasks with configurable intervals
 */

class Scheduler {
    constructor() {
        this.tasks = new Map(); // name -> task metadata
        this.intervalSchedulers = new Map(); // interval -> { timerId, tasks[] }
        this.isRunning = false;
    }

    /**
     * Convert interval string to milliseconds
     */
    static parseInterval(interval) {
        const intervals = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '3h': 3 * 60 * 60 * 1000,
            '2x/day': 12 * 60 * 60 * 1000,
            '1x/day': 24 * 60 * 60 * 1000
        };

        if (!intervals[interval]) {
            throw new Error(`Unknown interval: ${interval}. Supported: ${Object.keys(intervals).join(', ')}`);
        }

        return intervals[interval];
    }

    /**
     * Register a task
     */
    registerTask(name, interval, handler, options = {}) {
        if (!handler || typeof handler !== 'function') {
            throw new Error(`Task ${name}: handler must be a function`);
        }

        const intervalMs = Scheduler.parseInterval(interval);

        const task = {
            name,
            interval,
            intervalMs,
            handler,
            lastRun: options.runImmediately ? 0 : Date.now(), // 0 forces immediate run
            executionCount: 0,
            maxRuns: options.maxRuns || null,
            runImmediately: options.runImmediately || false,
            lastResult: null,
            lastError: null
        };

        this.tasks.set(name, task);
        console.log(`✓ Task registered: ${name} (interval: ${interval})`);

        // If scheduler is already running, add to existing interval scheduler or create new one
        if (this.isRunning) {
            if (!this.intervalSchedulers.has(intervalMs)) {
                // Create new scheduler for this interval
                const tasks = Array.from(this.tasks.values()).filter(t => t.intervalMs === intervalMs);
                console.log(`  ⏱ Starting scheduler for interval ${interval} (${tasks.length} tasks)`);
                
                const timerId = setInterval(() => {
                    this.executeTasksForInterval(tasks);
                }, intervalMs);

                this.intervalSchedulers.set(intervalMs, { timerId, tasks, interval });

                // Run immediately
                this.executeTasksForInterval(tasks);
            } else {
                // Add to existing interval scheduler
                const scheduler = this.intervalSchedulers.get(intervalMs);
                if (!scheduler.tasks.includes(task)) {
                    scheduler.tasks.push(task);
                }
            }
        }
    }

    /**
     * Start the scheduler - creates independent timers for each interval
     */
    start() {
        if (this.isRunning) {
            console.warn('Scheduler already running');
            return;
        }

        this.isRunning = true;
        console.log('🕐 Scheduler started');

        // Group tasks by interval
        const intervalMap = new Map();
        for (const task of this.tasks.values()) {
            if (!intervalMap.has(task.intervalMs)) {
                intervalMap.set(task.intervalMs, []);
            }
            intervalMap.get(task.intervalMs).push(task);
        }

        // Create independent scheduler for each interval
        for (const [intervalMs, tasks] of intervalMap) {
            const interval = tasks[0].interval; // All tasks in this group have same interval
            console.log(`  ⏱ Starting scheduler for interval ${interval} (${tasks.length} tasks)`);
            
            const timerId = setInterval(() => {
                this.executeTasksForInterval(tasks);
            }, intervalMs);

            this.intervalSchedulers.set(intervalMs, { timerId, tasks, interval });

            // Run immediately to check if any tasks should run on startup
            this.executeTasksForInterval(tasks);
        }
    }

    /**
     * Stop the scheduler - clears all interval timers
     */
    stop() {
        if (!this.isRunning) {
            console.warn('Scheduler not running');
            return;
        }

        // Clear all interval timers
        for (const [intervalMs, scheduler] of this.intervalSchedulers) {
            clearInterval(scheduler.timerId);
            console.log(`  ⏸ Stopped scheduler for interval ${scheduler.interval}`);
        }

        this.intervalSchedulers.clear();
        this.isRunning = false;
        console.log('🛑 Scheduler stopped');
    }

    /**
     * Execute tasks that share the same interval
     * Each interval group runs independently
     */
    async executeTasksForInterval(tasks) {
        const now = Date.now();

        for (const task of tasks) {
            // Skip if max runs reached
            if (task.maxRuns && task.executionCount >= task.maxRuns) {
                continue;
            }

            try {
                // Check if enough time has passed since last run
                const timeSinceLastRun = now - task.lastRun;
                const isDue = timeSinceLastRun >= task.intervalMs;

                if (isDue) {
                    console.log(`▶ Executing task: ${task.name}`);
                    
                    // Execute task
                    const startTime = Date.now();
                    const result = await task.handler(this);
                    const duration = Date.now() - startTime;

                    // Update task metadata
                    task.lastRun = now;
                    task.executionCount++;
                    task.lastResult = result;
                    task.lastError = null;

                    console.log(`✓ Task completed: ${task.name} (${duration}ms)`, result);
                }
            } catch (error) {
                console.error(`✗ Task failed: ${task.name}`, error.message);
                task.lastError = error.message;
                task.lastRun = now; // Update lastRun even on error
            }
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        const tasks = Array.from(this.tasks.values()).map(task => ({
            name: task.name,
            interval: task.interval,
            lastRun: new Date(task.lastRun),
            executionCount: task.executionCount,
            maxRuns: task.maxRuns,
            lastResult: task.lastResult,
            lastError: task.lastError,
            nextRun: new Date(task.lastRun + task.intervalMs)
        }));

        return {
            isRunning: this.isRunning,
            taskCount: this.tasks.size,
            tasks
        };
    }

    /**
     * Get a specific task info
     */
    getTaskInfo(name) {
        return this.tasks.get(name) || null;
    }

    /**
     * Unregister a task
     */
    unregisterTask(name) {
        const task = this.tasks.get(name);
        if (!task) {
            return false;
        }

        this.tasks.delete(name);

        // If scheduler is running, remove from interval scheduler
        if (this.isRunning) {
            const scheduler = this.intervalSchedulers.get(task.intervalMs);
            if (scheduler) {
                const index = scheduler.tasks.indexOf(task);
                if (index > -1) {
                    scheduler.tasks.splice(index, 1);
                }

                // If no more tasks for this interval, clean up the scheduler
                if (scheduler.tasks.length === 0) {
                    clearInterval(scheduler.timerId);
                    this.intervalSchedulers.delete(task.intervalMs);
                    console.log(`✓ Interval scheduler removed for ${task.interval} (no more tasks)`);
                }
            }
        }

        console.log(`✓ Task unregistered: ${name}`);
        return true;
    }
}

// Singleton instance
const scheduler = new Scheduler();

module.exports = scheduler;
