import { trpc } from '@/lib/trpc';
import type {
    SuggestTechnologiesRequest,
    ImplementationPlanRequest,
    ExplainMappingRequest,
    AskQuestionRequest,
    VendorMitigationPlanRequest
} from "../lib/advisor/types";

/**
 * Hook for suggesting technologies for a control
 */
export function useSuggestTechnologies() {
    const mutation = trpc.ai.advisor.suggestTechnologies.useMutation();

    return {
        suggest: mutation.mutate,
        suggestAsync: mutation.mutateAsync,
        isLoading: mutation.isPending,
        data: mutation.data,
        error: mutation.error,
        reset: mutation.reset,
    };
}

/**
 * Hook for generating implementation plans
 */
export function useImplementationPlan() {
    const mutation = trpc.ai.advisor.implementationPlan.useMutation();

    return {
        generate: mutation.mutate,
        generateAsync: mutation.mutateAsync,
        isLoading: mutation.isPending,
        data: mutation.data,
        error: mutation.error,
        reset: mutation.reset,
    };
}

/**
 * Hook for explaining regulation mappings
 */
export function useExplainMapping() {
    const mutation = trpc.ai.advisor.explainMapping.useMutation();

    return {
        explain: mutation.mutate,
        explainAsync: mutation.mutateAsync,
        isLoading: mutation.isPending,
        data: mutation.data,
        error: mutation.error,
        reset: mutation.reset,
    };
}

/**
 * Hook for asking general questions
 */
export function useAskQuestion() {
    const mutation = trpc.ai.advisor.askQuestion.useMutation();

    return {
        ask: mutation.mutate,
        askAsync: mutation.mutateAsync,
        isLoading: mutation.isPending,
        data: mutation.data,
        error: mutation.error,
        reset: mutation.reset,
    };
}

/**
 * Hook for generating vendor mitigation plans
 */
export function useVendorMitigationPlan() {
    const mutation = trpc.ai.advisor.vendorMitigationPlan.useMutation();

    return {
        generate: mutation.mutate,
        generateAsync: mutation.mutateAsync,
        isLoading: mutation.isPending,
        data: mutation.data,
        error: mutation.error,
        reset: mutation.reset,
    };
}
