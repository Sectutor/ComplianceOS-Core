
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AdvisorProvider } from '../contexts/AdvisorContext';
import { ClientContextProvider } from '../contexts/ClientContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { TooltipProvider } from '../components/ui/tooltip';

import superjson from 'superjson';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../lib/trpc';

// Mock AuthProvider to avoid issues with missing session
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
    return <AuthProvider>{children}</AuthProvider>;
}

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const trpcClient = trpc.createClient({
    links: [
        httpBatchLink({
            url: 'http://localhost:3000/api/trpc',
            transformer: superjson,
        }),
    ],
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    const queryClient = createTestQueryClient();
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <MockAuthProvider>
                    <ClientContextProvider>
                        <AdvisorProvider>
                            <ThemeProvider defaultTheme="light">
                                <TooltipProvider>
                                    {children}
                                </TooltipProvider>
                            </ThemeProvider>
                        </AdvisorProvider>
                    </ClientContextProvider>
                </MockAuthProvider>
            </QueryClientProvider>
        </trpc.Provider>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
