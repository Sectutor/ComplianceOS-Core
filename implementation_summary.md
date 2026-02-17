# Project Implementation Summary: Linking Assets to Risks

## Objectives Achieved
1.  **Risk Counting Accuracy**: 
    - Updated `getAssets` TRPC procedure to count risks linked to assets via the new `contextSnapshot->>'assetId'` JSONB path. This ensures accurate counts for risks created through the new wizard.
    - Replaced the deprecated `riskScenarios` linkage logic.

2.  **Asset Filtering in Risk Register**:
    - Enhanced `RiskRegister` component to accept an `assetId` filter via URL parameters (`?assetId=123`) and internal state.
    - Added a dropdown filter in the Risk Register toolbar for manual asset selection.
    - Updated `getRiskAssessments` backend query to support filtering by `assetId`.

3.  **Deep Linking Integration**:
    - **Asset Inventory Page**: Made the "Risks" badge clickable. Clicking it now navigates directly to the Risk Register, pre-filtered for that specific asset.
    - **Asset Editor**: Added a new "Linked Risks" tab to the Asset Editor. This tab lists all risks associated with the asset and provides a "Manage in Risk Register" button for deeper analysis.

4.  **Schema Strategy**:
    - Initially attempted to add a formal `assetId` column to `riskAssessments`.
    - **Reverted** this change due to database connection issues (`ECONNREFUSED`) during migration.
    - **Adopted** a JSONB query strategy (`sql` operator in Drizzle) which effectively links assets without requiring a schema migration, ensuring immediate functionality and stability.

## key Files Modified
- `packages/core/src/server/routers/risks.ts`: Backend logic for counting and filtering.
- `packages/core/src/components/risk/RiskRegister.tsx`: Filter state and URL initialization.
- `packages/core/src/pages/risk/RiskAssetsPage.tsx`: Navigation link on risk badges.
- `packages/core/src/pages/risk/RiskAssetEditor.tsx`: New "Linked Risks" tab.

## Next Steps / Recommendations
- **Performance Optimization**: For very large datasets (10k+ risks), reconsider adding a dedicated indexed `asset_id` column to `riskAssessments` once database connectivity is stable.
- **Unified Risk Creation**: Ensure all new risk creation flows (e.g., from Threat Intel) consistently populate the `contextSnapshot.assetId` field.
