import { describe, it, expect, vi } from "vitest";
vi.mock("../../db", () => {
  return {
    getDb: async () => ({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => [{ requireMfa: false }]
          })
        })
      })
    })
  };
});
import { requiresMFA } from "../trpc";

describe("requiresMFA middleware", () => {
  it("allows when client does not require MFA", async () => {
    const next = await (requiresMFA as any)({
      ctx: { clientId: 1, aal: 'aal1', req: {}, res: {} },
      next: ({ ctx }: any) => ({ ctx })
    });
    expect(next).toBeDefined();
  });

  it("blocks when client requires MFA and aal is aal1", async () => {
    vi.resetModules();
    vi.doMock("../../db", () => ({
      getDb: async () => ({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => [{ requireMfa: true }]
            })
          })
        })
      })
    }));
    const { requiresMFA: guard } = await import("../trpc");
    let threw = false;
    try {
      await (guard as any)({
        ctx: { clientId: 1, aal: 'aal1', req: {}, res: {} },
        next: ({ ctx }: any) => ({ ctx })
      });
    } catch (e: any) {
      threw = true;
      expect(e.code).toBeDefined();
    }
    expect(threw).toBe(true);
  });
});
