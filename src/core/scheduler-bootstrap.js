/**
 * Scheduler Bootstrap
 * Initializes and registers tasks on app startup
 */

const path = require('path');
const fs = require('fs');
const scheduler = require('../services/scheduler');

/**
 * Discover and register all tasks from src/tasks/ directory
 */
async function discoverAndRegisterTasks(tasksDir) {
    try {
        if (!fs.existsSync(tasksDir)) {
            console.log(`Tasks directory not found: ${tasksDir}`);
            return;
        }

        const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const taskModule = require(path.join(tasksDir, file));
                const taskName = file.replace('.js', '');

                if (taskModule.handler && taskModule.interval) {
                    scheduler.registerTask(
                        taskName,
                        taskModule.interval,
                        taskModule.handler,
                        {
                            runImmediately: taskModule.runImmediately || false,
                            maxRuns: taskModule.maxRuns || null
                        }
                    );
                } else {
                    console.warn(`⚠ Task file skipped (missing handler/interval): ${file}`);
                }
            } catch (error) {
                console.error(`✗ Failed to load task file: ${file}`, error.message);
            }
        }
    } catch (error) {
        console.error('✗ Error discovering tasks:', error.message);
    }
}

/**
 * Initialize scheduler and start it
 */
async function startScheduler() {
    const tasksDir = path.join(__dirname, '../tasks');
    
    console.log('📋 Discovering tasks...');
    await discoverAndRegisterTasks(tasksDir);

    const status = scheduler.getStatus();
    console.log(`📊 Registered ${status.taskCount} tasks`);

    scheduler.start();
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
    scheduler.stop();
}

module.exports = {
    startScheduler,
    stopScheduler,
    scheduler
};
