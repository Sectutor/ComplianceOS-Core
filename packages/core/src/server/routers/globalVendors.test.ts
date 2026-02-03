import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGlobalVendorsRouter } from './globalVendors';
import { TRPCError } from '@trpc/server';

// Mock dependencies
const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
};

vi.mock('../../db', () => ({
    getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock('../../lib/ai/vrm-agent', () => ({
    vrmAgent: {
        analyzeTrustCenter: vi.fn(),
    },
}));

describe('globalVendors router', () => {
    let router: any;

    // Mock TRPC builder
    const t = {
        router: (handlers: any) => handlers
    };

    // Mock clientProcedure
    const mockClientProcedure = {
        input: (schema: any) => ({
            query: (handler: any) => {
                return Object.assign(handler, { _def: { type: 'query', input: schema } });
            },
            mutation: (handler: any) => {
                return Object.assign(handler, { _def: { type: 'mutation', input: schema } });
            }
        })
    };

    beforeEach(() => {
        vi.clearAllMocks();
        router = createGlobalVendorsRouter(t, mockClientProcedure);
    });

    describe('import', () => {
        it('should import a new vendor definition', async () => {
            // Setup Mocks
            const input = { clientId: 1, globalVendorId: 101 };
            const mockGlobalVendor = {
                id: 101,
                name: "Test Vendor",
                website: "test.com",
                trustCenterUrl: "https://trust.test.com"
            };
            const mockNewVendor = { ...mockGlobalVendor, id: 200, clientId: 1, source: "Global Catalog" };

            // Mock DB Implementation
            // 1. Select Global Vendor
            // 2. Select Existing Vendor (return empty)
            // 3. Insert New Vendor

            // We need to chain the mocks carefully because they are fluent interfaces
            const fromMock = vi.fn();
            const whereMock = vi.fn();
            const limitMock = vi.fn();
            const valuesMock = vi.fn();
            const returningMock = vi.fn();

            mockDb.select.mockReturnValue({ from: fromMock });
            fromMock.mockReturnValue({ where: whereMock });
            whereMock.mockReturnValue({ limit: limitMock });

            // select(globalVendors) -> returns one
            // select(vendors) -> returns empty
            limitMock
                .mockResolvedValueOnce([mockGlobalVendor]) // First call: global vendor found
                .mockResolvedValueOnce([]);                // Second call: no existing vendor

            mockDb.insert.mockReturnValue({ values: valuesMock });
            valuesMock.mockReturnValue({ returning: returningMock });
            returningMock.mockResolvedValue([mockNewVendor]);

            // Execute
            const result = await router.import({ input });

            // Assert
            expect(result).toEqual(mockNewVendor);
            expect(mockDb.select).toHaveBeenCalledTimes(2);
            expect(mockDb.insert).toHaveBeenCalledTimes(1);

            // Check insert execution
            expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
                name: "Test Vendor",
                website: "test.com",
                source: "Global Catalog"
            }));
        });

        it('should return existing vendor if already imported', async () => {
            // Setup Mocks
            const input = { clientId: 1, globalVendorId: 101 };
            const mockGlobalVendor = {
                id: 101,
                name: "Test Vendor",
                website: "test.com"
            };
            const mockExistingVendor = { id: 200, name: "Test Vendor", website: "test.com" };

            const fromMock = vi.fn();
            const whereMock = vi.fn();
            const limitMock = vi.fn();

            mockDb.select.mockReturnValue({ from: fromMock });
            fromMock.mockReturnValue({ where: whereMock });
            whereMock.mockReturnValue({ limit: limitMock });

            limitMock
                .mockResolvedValueOnce([mockGlobalVendor]) // Found global
                .mockResolvedValueOnce([mockExistingVendor]); // Found existing

            // Execute
            const result = await router.import({ input });

            // Assert
            expect(result).toEqual(mockExistingVendor);
            expect(mockDb.insert).not.toHaveBeenCalled();
        });

        it('should throw NOT_FOUND if global vendor does not exist', async () => {
            // Setup Mocks
            const input = { clientId: 1, globalVendorId: 999 };

            const fromMock = vi.fn();
            const whereMock = vi.fn();
            const limitMock = vi.fn();

            mockDb.select.mockReturnValue({ from: fromMock });
            fromMock.mockReturnValue({ where: whereMock });
            whereMock.mockReturnValue({ limit: limitMock });

            limitMock.mockResolvedValueOnce([]); // Global vendor NOT found

            // Execute & Assert
            await expect(router.import({ input })).rejects.toThrow('Global vendor not found');
        });
    });
});
