import { describe, it, expect } from 'vitest';
import * as db from './db';

describe('RACI Matrix Functions', () => {
  it('should return all employees even without assignments', async () => {
    const result = await db.getRACIMatrix(1);
    console.log('getRACIMatrix result:', JSON.stringify(result, null, 2));
    
    // Should return at least Sarah Johnson
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Even if no assignments, should return employees
    const sarah = result.find((emp: any) => emp.employeeName === 'Sarah Johnson');
    expect(sarah).toBeDefined();
    expect(sarah?.employeeId).toBe(1);
    expect(sarah?.department).toBe('Security');
    expect(sarah?.jobTitle).toBe('Security Manager');
  });

  it('should return gap analysis for client', async () => {
    const result = await db.getRACIGapAnalysis(1);
    console.log('getRACIGapAnalysis result:', JSON.stringify(result, null, 2));
    
    expect(result).toBeDefined();
    expect(result.totalControls).toBeGreaterThan(0);
    expect(result.totalPolicies).toBeGreaterThan(0);
  });
});
