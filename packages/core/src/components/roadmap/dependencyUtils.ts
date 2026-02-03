/**
 * Utility functions for dependency management and validation
 */

export interface Task {
    id: number;
    dependencies: number[];
    title: string;
    status?: string;
}

export interface TaskWithStatus extends Task {
    status: string;
}

/**
 * Check if a task is blocked by its dependencies
 * Returns true if task is blocked, false otherwise
 */
export function isTaskBlocked(taskId: number, allTasks: TaskWithStatus[]): boolean {
    const task = allTasks.find(t => t.id === taskId);
    if (!task || !task.dependencies || task.dependencies.length === 0) {
        return false;
    }
    
    // Check if any dependency is not completed
    for (const depId of task.dependencies) {
        const dependency = allTasks.find(t => t.id === depId);
        if (dependency && dependency.status !== 'done') {
            return true; // Task is blocked
        }
    }
    
    return false; // All dependencies are completed
}

/**
 * Check if adding a dependency would create a cycle
 * Returns true if cycle would be created, false otherwise
 */
export function wouldCreateCycle(
    tasks: Task[],
    fromTaskId: number,
    toTaskId: number
): boolean {
    // Create adjacency list
    const graph: Map<number, number[]> = new Map();
    
    // Initialize graph with existing dependencies
    tasks.forEach(task => {
        graph.set(task.id, [...(task.dependencies || [])]);
    });
    
    // Add the proposed dependency
    const fromDeps = graph.get(fromTaskId) || [];
    if (!fromDeps.includes(toTaskId)) {
        graph.set(fromTaskId, [...fromDeps, toTaskId]);
    }
    
    // Check for cycles using DFS
    const visited = new Set<number>();
    const recursionStack = new Set<number>();
    
    function hasCycle(nodeId: number): boolean {
        if (recursionStack.has(nodeId)) {
            return true; // Cycle detected
        }
        
        if (visited.has(nodeId)) {
            return false;
        }
        
        visited.add(nodeId);
        recursionStack.add(nodeId);
        
        const neighbors = graph.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (hasCycle(neighbor)) {
                return true;
            }
        }
        
        recursionStack.delete(nodeId);
        return false;
    }
    
    // Check all nodes
    for (const taskId of graph.keys()) {
        if (hasCycle(taskId)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Find all cycles in the current dependency graph
 * Returns array of cycle descriptions
 */
export function findDependencyCycles(tasks: Task[]): string[] {
    const cycles: string[] = [];
    const graph: Map<number, number[]> = new Map();
    
    // Build graph
    tasks.forEach(task => {
        graph.set(task.id, [...(task.dependencies || [])]);
    });
    
    const visited = new Set<number>();
    const path: number[] = [];
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    function dfs(nodeId: number): boolean {
        if (visited.has(nodeId)) {
            // Check if this node is in the current path (cycle)
            const cycleIndex = path.indexOf(nodeId);
            if (cycleIndex !== -1) {
                // Found a cycle
                const cycle = path.slice(cycleIndex);
                cycle.push(nodeId); // Close the cycle
                
                // Create cycle description
                const cycleNames = cycle.map(id => {
                    const task = taskMap.get(id);
                    return task ? `"${task.title}" (ID: ${id})` : `Task ${id}`;
                });
                
                cycles.push(`Cycle detected: ${cycleNames.join(' → ')}`);
                return true;
            }
            return false;
        }
        
        visited.add(nodeId);
        path.push(nodeId);
        
        const neighbors = graph.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (dfs(neighbor)) {
                return true;
            }
        }
        
        path.pop();
        return false;
    }
    
    // Check all nodes
    for (const taskId of graph.keys()) {
        if (!visited.has(taskId)) {
            dfs(taskId);
        }
    }
    
    return cycles;
}

/**
 * Get all tasks that depend on a specific task (reverse dependencies)
 */
export function getDependentTasks(tasks: Task[], taskId: number): Task[] {
    const dependentTasks: Task[] = [];
    
    tasks.forEach(task => {
        if (task.dependencies && task.dependencies.includes(taskId)) {
            dependentTasks.push(task);
        }
    });
    
    return dependentTasks;
}

/**
 * Check if a task can be safely deleted without breaking dependencies
 * Returns array of tasks that would be affected
 */
export function getAffectedTasksOnDelete(tasks: Task[], taskIdToDelete: number): Task[] {
    const affectedTasks: Task[] = [];
    
    // Find tasks that depend on the task to be deleted
    tasks.forEach(task => {
        if (task.dependencies && task.dependencies.includes(taskIdToDelete)) {
            affectedTasks.push(task);
        }
    });
    
    return affectedTasks;
}

/**
 * Validate a single dependency addition
 * Returns error message if invalid, null if valid
 */
export function validateDependency(
    tasks: Task[],
    fromTaskId: number,
    toTaskId: number
): string | null {
    // Check for self-dependency
    if (fromTaskId === toTaskId) {
        return 'A task cannot depend on itself';
    }
    
    // Check if dependency already exists
    const fromTask = tasks.find(t => t.id === fromTaskId);
    if (fromTask && fromTask.dependencies && fromTask.dependencies.includes(toTaskId)) {
        return 'This dependency already exists';
    }
    
    // Check for cycles
    if (wouldCreateCycle(tasks, fromTaskId, toTaskId)) {
        return 'Adding this dependency would create a circular dependency';
    }
    
    return null; // Valid
}

/**
 * Get the critical path (longest path) through the dependency graph
 * Returns array of task IDs on the critical path
 */
export function getCriticalPath(tasks: Task[]): number[] {
    if (tasks.length === 0) return [];
    
    // Create adjacency list and reverse adjacency list
    const graph: Map<number, number[]> = new Map();
    const reverseGraph: Map<number, number[]> = new Map();
    
    tasks.forEach(task => {
        graph.set(task.id, [...(task.dependencies || [])]);
        // Initialize reverse graph
        if (!reverseGraph.has(task.id)) {
            reverseGraph.set(task.id, []);
        }
    });
    
    // Build reverse graph
    tasks.forEach(task => {
        const deps = task.dependencies || [];
        deps.forEach(depId => {
            const current = reverseGraph.get(depId) || [];
            reverseGraph.set(depId, [...current, task.id]);
        });
    });
    
    // Find start nodes (nodes with no dependencies)
    const startNodes = tasks
        .filter(task => !task.dependencies || task.dependencies.length === 0)
        .map(task => task.id);
    
    if (startNodes.length === 0) {
        // If no start nodes, use all nodes
        return tasks.map(t => t.id);
    }
    
    // Simple BFS to find longest path (for demonstration)
    // In a real implementation, you'd want to use topological sort and DP
    let longestPath: number[] = [];
    
    function dfs(current: number, path: number[]): void {
        const newPath = [...path, current];
        
        if (newPath.length > longestPath.length) {
            longestPath = newPath;
        }
        
        const neighbors = reverseGraph.get(current) || [];
        for (const neighbor of neighbors) {
            dfs(neighbor, newPath);
        }
    }
    
    // Start from each start node
    startNodes.forEach(startNode => {
        dfs(startNode, []);
    });
    
    return longestPath;
}

/**
 * Get topological order of tasks (if no cycles exist)
 * Returns array of task IDs in topological order, or empty array if cycles exist
 */
export function getTopologicalOrder(tasks: Task[]): number[] {
    const cycles = findDependencyCycles(tasks);
    if (cycles.length > 0) {
        return []; // Cannot get topological order if cycles exist
    }
    
    const graph: Map<number, number[]> = new Map();
    const inDegree: Map<number, number> = new Map();
    
    // Initialize
    tasks.forEach(task => {
        graph.set(task.id, [...(task.dependencies || [])]);
        inDegree.set(task.id, 0);
    });
    
    // Calculate in-degrees
    tasks.forEach(task => {
        const deps = task.dependencies || [];
        deps.forEach(depId => {
            inDegree.set(depId, (inDegree.get(depId) || 0) + 1);
        });
    });
    
    // Kahn's algorithm
    const queue: number[] = [];
    const result: number[] = [];
    
    // Add nodes with in-degree 0 to queue
    inDegree.forEach((degree, nodeId) => {
        if (degree === 0) {
            queue.push(nodeId);
        }
    });
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        result.push(current);
        
        const neighbors = graph.get(current) || [];
        neighbors.forEach(neighbor => {
            const newDegree = (inDegree.get(neighbor) || 1) - 1;
            inDegree.set(neighbor, newDegree);
            
            if (newDegree === 0) {
                queue.push(neighbor);
            }
        });
    }
    
    // Check if all nodes were processed
    if (result.length !== tasks.length) {
        return []; // Graph has cycles
    }
    
    return result;
}