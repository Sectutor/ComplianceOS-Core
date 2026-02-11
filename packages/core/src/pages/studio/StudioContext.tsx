import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { z } from 'zod';

// Simple ID generator to avoid strict dependency on uuid
export const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

// --- Types ---

export interface FrameworkMetadata {
    name: string;
    slug: string;
    version: string;
    description: string;
    author: string;
    icon: string;
}

export interface FrameworkPhase {
    id: string;
    name: string;
    description: string;
    order: number;
}

export interface FrameworkRequirement {
    id: string;
    description: string; // The "Control Text" or "Requirement"
    title?: string;      // Optional ID/Title like "AC-1"
    phaseId: string;     // Links to a phase
}

interface StudioState {
    metadata: FrameworkMetadata;
    phases: FrameworkPhase[];
    requirements: FrameworkRequirement[];
    activeStep: 'basics' | 'phases' | 'requirements' | 'export';
    simpleMode: boolean;
}

type Action =
    | { type: 'UPDATE_METADATA'; field: keyof FrameworkMetadata; value: string }
    | { type: 'ADD_PHASE'; phase: FrameworkPhase }
    | { type: 'UPDATE_PHASE'; id: string; field: keyof FrameworkPhase; value: string | number }
    | { type: 'DELETE_PHASE'; id: string }
    | { type: 'REORDER_PHASES'; phases: FrameworkPhase[] }
    | { type: 'ADD_REQUIREMENT'; requirement: FrameworkRequirement }
    | { type: 'UPDATE_REQUIREMENT'; id: string; field: keyof FrameworkRequirement; value: string }
    | { type: 'DELETE_REQUIREMENT'; id: string }
    | { type: 'BULK_ADD_REQUIREMENTS'; requirements: FrameworkRequirement[] }
    | { type: 'SET_STEP'; step: StudioState['activeStep'] }
    | { type: 'TOGGLE_SIMPLE_MODE'; enabled: boolean }
    | { type: 'RESET' }; // For clearing state

// --- Initial State ---

const initialState: StudioState = {
    metadata: {
        name: '',
        slug: '',
        version: '1.0.0',
        description: '',
        author: '',
        icon: 'shield'
    },
    phases: [
        { id: 'p1', name: 'Phase 1: Foundation', description: 'Initial setup and documentation.', order: 1 },
        { id: 'p2', name: 'Phase 2: Implementation', description: 'Technical controls and processes.', order: 2 },
        { id: 'p3', name: 'Phase 3: Verification', description: 'Audits and continuous monitoring.', order: 3 },
    ],
    requirements: [],
    activeStep: 'basics',
    simpleMode: false
};

// --- Reducer ---

function studioReducer(state: StudioState, action: Action): StudioState {
    switch (action.type) {
        case 'UPDATE_METADATA':
            return { ...state, metadata: { ...state.metadata, [action.field]: action.value } };
        case 'ADD_PHASE':
            return { ...state, phases: [...state.phases, action.phase] };
        case 'UPDATE_PHASE':
            return {
                ...state,
                phases: state.phases.map(p => p.id === action.id ? { ...p, [action.field]: action.value } : p)
            };
        case 'DELETE_PHASE':
            return {
                ...state,
                phases: state.phases.filter(p => p.id !== action.id),
                requirements: state.requirements.map(r => r.phaseId === action.id ? { ...r, phaseId: '' } : r) // Unlink reqs
            };
        case 'REORDER_PHASES':
            return { ...state, phases: action.phases };
        case 'ADD_REQUIREMENT':
            return { ...state, requirements: [...state.requirements, action.requirement] };
        case 'UPDATE_REQUIREMENT':
            return {
                ...state,
                requirements: state.requirements.map(r => r.id === action.id ? { ...r, [action.field]: action.value } : r)
            };
        case 'DELETE_REQUIREMENT':
            return { ...state, requirements: state.requirements.filter(r => r.id !== action.id) };
        case 'BULK_ADD_REQUIREMENTS':
            return { ...state, requirements: [...state.requirements, ...action.requirements] };
        case 'SET_STEP':
            return { ...state, activeStep: action.step };
        case 'TOGGLE_SIMPLE_MODE':
            const newSimpleMode = action.enabled;
            let updatedPhases = state.phases;

            // If enabling simple mode and no phases exist, create a default one
            if (newSimpleMode && state.phases.length === 0) {
                updatedPhases = [{
                    id: generateId(),
                    name: 'Implementation',
                    description: 'General implementation steps',
                    order: 1
                }];
            }

            return {
                ...state,
                simpleMode: newSimpleMode,
                phases: updatedPhases
            };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

// --- Context ---

const StudioContext = createContext<{
    state: StudioState;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export const StudioProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(studioReducer, initialState);

    return (
        <StudioContext.Provider value={{ state, dispatch }}>
            {children}
        </StudioContext.Provider>
    );
};

export const useStudio = () => {
    const context = useContext(StudioContext);
    if (!context) {
        throw new Error('useStudio must be used within a StudioProvider');
    }
    return context;
};
