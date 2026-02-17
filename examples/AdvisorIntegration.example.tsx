/**
 * Integration Example: How to Use AI Advisor Components
 * This file shows how to integrate the AI Advisor into your existing pages
 */

import { CopilotButton } from '../components/advisor/CopilotButton';
import TechSuggestionPanel from '../components/advisor/TechSuggestionPanel';
import ImplementationPlanViewer from '../components/advisor/ImplementationPlanViewer';
import MappingExplainer from '../components/advisor/MappingExplainer';
import QuickAsk from '../components/advisor/QuickAsk';

// ============================================================
// Example 1: Add Copilot to Main Layout
// ============================================================

export function AppLayout({ children, client }: { children: React.ReactNode; client: any }) {
    return (
        <div>
            {children}

            {/* Add Copilot button globally - will appear on all pages */}
            {client && <CopilotButton clientId={client.id} />}
        </div>
    );
}

// ============================================================
// Example 2: Controls Page Integration
// ============================================================

export function ControlDetailPage({ control, clientId }: { control: any; clientId: number }) {
    return (
        <div>
            <h1>{control.name}</h1>
            <p>{control.description}</p>

            {/* Tech Suggestion Panel */}
            <div className="mt-6">
                <TechSuggestionPanel
                    clientId={clientId}
                    controlId={control.id}
                    controlName={control.name}
                />
            </div>

            {/* Implementation Plan */}
            <div className="mt-4">
                <ImplementationPlanViewer
                    clientId={clientId}
                    controlId={control.id}
                    controlName={control.name}
                    selectedTech={undefined} // or pass selected tech from TechSuggestionPanel
                />
            </div>

            {/* Quick Ask about this control */}
            <div className="mt-4">
                <QuickAsk
                    clientId={clientId}
                    placeholder="Ask me about this control..."
                    context={{ type: 'control', id: control.id.toString() }}
                />
            </div>
        </div>
    );
}

// ============================================================
// Example 3: Regulations Page Integration
// ============================================================

export function RegulationArticlePage({
    clientId,
    regulationId,
    articleId,
    articleTitle
}: {
    clientId: number;
    regulationId: string;
    articleId: string;
    articleTitle: string;
}) {
    return (
        <div>
            <h1>{articleTitle}</h1>

            {/* Mapping Explainer */}
            <MappingExplainer
                clientId={clientId}
                regulationId={regulationId}
                articleId={articleId}
                articleTitle={articleTitle}
            />

            {/* Quick Ask about this article */}
            <div className="mt-4">
                <QuickAsk
                    clientId={clientId}
                    placeholder="Ask me about this regulation article..."
                    context={{ type: 'regulation', id: articleId }}
                />
            </div>
        </div>
    );
}

// ============================================================
// Example 4: Policy Editor Integration
// ============================================================

export function PolicyEditorPage({ policy, clientId }: { policy: any; clientId: number }) {
    return (
        <div>
            <h1>{policy.name}</h1>

            {/* Inline "Ask AI" button in toolbar */}
            <div className="flex items-center gap-2 mb-4">
                <button>Save</button>
                <button>Preview</button>
                <QuickAsk
                    clientId={clientId}
                    placeholder="How can I improve this policy?"
                    context={{ type: 'policy', id: policy.id.toString() }}
                />
            </div>

            {/* Policy editor content */}
            <textarea>{policy.content}</textarea>
        </div>
    );
}

// ============================================================
// Example 5: Evidence Page Integration
// ============================================================

export function EvidencePage({ clientId }: { clientId: number }) {
    return (
        <div>
            <h1>Evidence</h1>

            {/* Quick Ask for evidence guidance */}
            <div className="mb-6">
                <QuickAsk
                    clientId={clientId}
                    placeholder="What evidence do I need for this control?"
                />
            </div>

            {/* Evidence list */}
            <div>...</div>
        </div>
    );
}
