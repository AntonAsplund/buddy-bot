/**
 * Example Task
 * 
 * This is a template showing how to create a scheduled task.
 * Copy this file and modify the handler to create new tasks.
 */

module.exports = {
    // Required: Task execution interval
    // Supported: '1m', '5m', '15m', '30m', '1h', '3h', '2x/day', '1x/day'
    interval: '15m',

    // Optional: Run immediately on scheduler startup
    runImmediately: false,

    // Optional: Limit total executions (null = infinite)
    maxRuns: null,

    // Required: Async handler function
    // Receives scheduler instance for status queries
    // Should return { status, message } or similar
    handler: async (scheduler) => {
        // Your task logic here
        console.log('  → Example task executing');
        
        // Example: Get scheduler status
        // const status = scheduler.getStatus();
        // console.log(`  → Active tasks: ${status.taskCount}`);

        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
            status: 'success',
            message: 'Example task completed',
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Task Module Structure:
 * 
 * {
 *   interval: string,              // Required: '1m', '5m', '15m', '30m', '1h', '3h', '2x/day', '1x/day'
 *   runImmediately: boolean,       // Optional: default false
 *   maxRuns: number | null,        // Optional: default null (infinite)
 *   handler: async function        // Required: (scheduler) => Promise<any>
 * }
 * 
 * Handler examples:
 * 
 * // Cleanup old data
 * handler: async (scheduler) => {
 *   await cleanupOldRecords();
 *   return { status: 'success', cleaned: 42 };
 * }
 * 
 * // Health check
 * handler: async (scheduler) => {
 *   const healthy = await checkHealth();
 *   return { status: 'success', healthy };
 * }
 * 
 * // Send notifications
 * handler: async (scheduler) => {
 *   const sent = await sendNotifications();
 *   return { status: 'success', notificationsSent: sent };
 * }
 * 
 * // Report generation
 * handler: async (scheduler) => {
 *   const report = await generateReport();
 *   return { status: 'success', reportPath: report };
 * }
 */
