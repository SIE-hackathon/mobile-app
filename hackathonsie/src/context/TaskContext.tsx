/**
 * Task Context
 * Provides selected task information throughout the app
 */

import React, { createContext, useContext, useState } from 'react';
import { Task } from '../types/database.types';

interface TaskContextType {
    selectedTask: Task | null;
    setSelectedTask: (task: Task | null) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    return (
        <TaskContext.Provider value={{ selectedTask, setSelectedTask }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTask() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTask must be used within a TaskProvider');
    }
    return context;
}
