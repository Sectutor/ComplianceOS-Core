
export async function generateEmbedding(text: string) {
    // Return a dummy embedding for open source
    return { embedding: new Array(1536).fill(0) };
}
