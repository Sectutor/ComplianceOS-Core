
// Stub for Core Edition Indexing Service
// In Premium, this handles RAG indexing (embeddings, pgvector, etc.)
// In Core, this is a no-op placeholder to satisfy the build but provide clear feedback.

export const IndexingService = {
    async indexDocument(
        clientId: number,
        docType: string,
        docId: string,
        content: any,
        metadata: any = {}
    ) {
        // Log info for developers, but do nothing
        console.info(`[Core] Indexing requested for ${docType}/${docId} - Skipped (Premium Feature)`);
        return { docId, chunks: 0, tokens: 0 };
    },

    async deleteDocumentIndex(
        clientId: number,
        docType: string,
        docId: string
    ) {
        // No-op
        return;
    }
};
