import React, { useEffect, createContext, useContext, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { trpc } from '../lib/trpc';
import { useAuth } from '../contexts/AuthContext';

interface TourContextType {
    startTour: () => void;
}

const TourContext = createContext<TourContextType>({
    startTour: () => { }
});

export const useTour = () => useContext(TourContext);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const utils = trpc.useUtils();

    // We need to fetch the full user profile to check hasSeenTour
    // The auth context user might be stale or minimal
    const { data: dbUser } = trpc.users.me.useQuery(undefined, {
        enabled: !!user
    });

    const completeTourMutation = trpc.users.completeTour.useMutation({
        onSuccess: () => {
            utils.users.me.invalidate();
        }
    });

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            doneBtnText: 'Finish',
            nextBtnText: 'Next',
            prevBtnText: 'Previous',
            allowClose: true,
            steps: [
                {
                    popover: {
                        title: 'Welcome to GRCompliance',
                        description: 'Let us show you around your new compliance operating system.',
                        align: 'center'
                    }
                },
                {
                    element: '[data-tour="sidebar-dashboard"]',
                    popover: {
                        title: 'Dashboard',
                        description: 'Your central hub for monitoring compliance status across all clients.',
                        side: 'right'
                    }
                },
                {
                    element: '[data-tour="client-switcher"]',
                    popover: {
                        title: 'Client Management',
                        description: 'Switch between different client workspaces here.',
                        side: 'right'
                    }
                },
                {
                    element: '[data-tour="sidebar-clients"]',
                    popover: {
                        title: 'Clients List',
                        description: 'View and manage all your client organizations.',
                        side: 'right'
                    }
                },
                {
                    element: '[data-tour="user-menu"]',
                    popover: {
                        title: 'Profile & Settings',
                        description: 'Manage your account settings and preferences here.',
                        side: 'left'
                    }
                }
            ],
            onDestroyStarted: () => {
                if (!dbUser?.hasSeenTour) {
                    completeTourMutation.mutate();
                }
                driverObj.destroy();
            }
        });

        driverObj.drive();
    };

    useEffect(() => {
        if (dbUser && !dbUser.hasSeenTour && !completeTourMutation.isLoading && !completeTourMutation.isSuccess) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                startTour();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [dbUser]);

    return (
        <TourContext.Provider value={{ startTour }}>
            {children}
        </TourContext.Provider>
    );
};
