
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

// Mock everything complex
vi.mock('@/lib/trpc', () => ({
    trpc: {
        useContext: vi.fn(() => ({
            findings: { list: { invalidate: vi.fn() } },
            evidence: { list: { invalidate: vi.fn() } },
            users: { me: { invalidate: vi.fn() } },
        })),
        useUtils: vi.fn(() => ({
            findings: { list: { invalidate: vi.fn() } },
            evidence: { list: { invalidate: vi.fn() } },
            users: { me: { invalidate: vi.fn() } },
        })),
        evidence: {
            list: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            getFiles: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            getAllComments: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            verifyEvidence: { useMutation: vi.fn(() => ({ mutate: vi.fn() })) },
            updateStatus: { useMutation: vi.fn(() => ({ mutate: vi.fn() })) },
        },
        findings: {
            list: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
            create: { useMutation: vi.fn(() => ({ mutate: vi.fn() })) },
        },
        audit: {
            inviteAuditor: { useMutation: vi.fn(() => ({ mutate: vi.fn() })) },
            listInvitations: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
        },
        clients: {
            get: { useQuery: vi.fn(() => ({ data: { id: 3, name: 'Test Client' }, isLoading: false })) },
        },
        users: {
            me: { useQuery: vi.fn(() => ({ data: { hasSeenTour: true }, isLoading: false })) },
            getProfile: { useQuery: vi.fn(() => ({ data: { hasSeenTour: true }, isLoading: false })) },
            completeTour: { useMutation: vi.fn(() => ({ mutate: vi.fn() })) },
        }
    }
}));

// Fallback mocks for relative imports that might still be used
vi.mock('../lib/trpc', () => vi.importMock('@/lib/trpc'));

vi.mock('@/contexts/AuthContext', () => ({
    AuthProvider: ({ children }: any) => <div>{children}</div>,
    useAuth: () => ({ user: { email: 'test@example.com' }, loading: false }),
}));

vi.mock('@/contexts/ClientContext', () => ({
    ClientContextProvider: ({ children }: any) => <div>{children}</div>,
    useClientContext: () => ({ selectedClientId: 3, setSelectedClientId: vi.fn() }),
}));

vi.mock('wouter', () => ({
    useRoute: vi.fn().mockReturnValue([true, { clientId: '3' }]),
    useLocation: vi.fn().mockReturnValue(['/', vi.fn()]),
    Link: ({ children }: any) => <a data-testid="link">{children}</a>,
}));

// Mock the DashboardLayout using the alias as used in AuditHub.tsx
vi.mock('@/components/DashboardLayout', () => ({
    default: ({ children, title }: any) => (
        <div data-testid="dashboard-layout">
            <h1 data-testid="layout-title">{title}</h1>
            {children}
        </div>
    ),
}));

// Mock the core components that might be problematic
vi.mock('@complianceos/ui/ui/tooltip', () => ({
    TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

// We need a very basic version of AuditHub for testing if the real one has too many dependencies
import AuditHub from './AuditHub';

describe('AuditHub Smoke Test', () => {
    it('renders without crashing with mocked dependencies', () => {
        // Just check if it renders anything
        render(<AuditHub />);
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
        expect(screen.getByTestId('layout-title')).toHaveTextContent(/Audit Hub/i);

        // Verify AuditHub internal content exists
        expect(screen.getByText(/AuditWorkspace™/i)).toBeInTheDocument();
        expect(screen.getByText(/Audit Workspace/i)).toBeInTheDocument();
        expect(screen.getByText(/PBC Inbox/i)).toBeInTheDocument();
    });
});
