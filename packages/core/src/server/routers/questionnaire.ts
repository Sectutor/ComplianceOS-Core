import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
// import { askQuestion } from '../../lib/advisor/service';
import * as XLSX from 'xlsx';
import { llmService } from '../../lib/llm/service';
import { getDb } from '../../db';
import * as schema from '../../schema';
import { eq, desc, and } from "drizzle-orm";
import { sendEmail } from '../../lib/email/transporter';
import { rateLimiter } from "../../lib/redis";

// Rate limiting configuration for public vendor endpoints
// Configurable via environment variables with sensible defaults
const VENDOR_PORTAL_RATE_LIMIT = parseInt(process.env.VENDOR_PORTAL_RATE_LIMIT || '10', 10);
const VENDOR_PORTAL_RATE_WINDOW_MS = parseInt(process.env.VENDOR_PORTAL_RATE_WINDOW_MS || '60000', 10); // 1 minute default
const VENDOR_PORTAL_SUBMIT_LIMIT = parseInt(process.env.VENDOR_PORTAL_SUBMIT_LIMIT || '5', 10);

// In-memory rate limit tracking fallback (if Redis unavailable)
const inMemoryRateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given identifier (IP or token)
 * Uses Redis if available, falls back to in-memory
 */
async function checkRateLimit(identifier: string): Promise<boolean> {
  // Try Redis rate limiter first
  const isLimited = await rateLimiter.isRateLimited(
    identifier,
    VENDOR_PORTAL_RATE_LIMIT,
    VENDOR_PORTAL_RATE_WINDOW_MS
  );

  if (isLimited) return true;

  // Fallback to in-memory if Redis not available
  const now = Date.now();
  const record = inMemoryRateLimits.get(identifier);

  if (!record || now > record.resetTime) {
    inMemoryRateLimits.set(identifier, { count: 1, resetTime: now + VENDOR_PORTAL_RATE_WINDOW_MS });
    return false;
  }

  if (record.count >= VENDOR_PORTAL_RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

// Helper function to generate or reuse vendor token for questionnaire
// Extracted to avoid duplicate logic between generateVendorLink and sendVendorInvite
async function ensureVendorToken(
  db: any,
  questionnaireId: number,
  vendorEmail: string,
  vendorName: string,
  expiresInDays: number
) {
  const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, questionnaireId));
  if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

  // Check if a valid token already exists - reuse it instead of generating a new one
  // This prevents invalidating previously shared links
  let token = project.vendorToken;
  let expiresAt = project.vendorLinkExpiresAt;

  // Only generate new token if:
  // 1. No existing token, OR
  // 2. Existing token is expired, OR
  // 3. Email is different (new vendor)
  const needsNewToken = !token ||
    !expiresAt ||
    new Date(expiresAt) < new Date() ||
    project.vendorEmail !== vendorEmail;

  if (needsNewToken) {
    token = crypto.randomBytes(32).toString("hex");
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Update questionnaire with vendor info and token
    await db.update(schema.questionnaires)
      .set({
        status: 'vendor_pending',
        vendorToken: token,
        vendorEmail: vendorEmail,
        vendorName: vendorName,
        vendorLinkExpiresAt: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(schema.questionnaires.id, questionnaireId));
  }

  return { token, expiresAt, project };
}

// Helper to parse file content validation
const FileInputSchema = z.object({
  fileBase64: z.string(),
  filename: z.string(),
  fileType: z.enum(['pdf', 'xlsx', 'csv', 'docx'])
});

export function createQuestionnaireRouter(t: any, protectedProcedure: any, premiumClientProcedure: any, publicProcedure: any) {
  return t.router({
    /**
     * Parse an uploaded questionnaire file to extract questions
     */
    parse: premiumClientProcedure
      .input(FileInputSchema)
      .mutation(async ({ input }: any) => {
        try {
          const buffer = Buffer.from(input.fileBase64, 'base64');
          let textContent = "";
          let parsedQuestions: Array<{ questionId?: string; question: string }> = [];

          // 1. Extract Text based on file type
          if (input.fileType === 'pdf') {
            const pdf = require('pdf-parse');
            const data = await pdf(buffer);
            textContent = data.text;

            // For PDFs, use LLM extraction (no structured columns)
            const truncatedText = textContent.substring(0, 50000);
            const systemPrompt = `You are a helpful assistant that extracts questions from a security questionnaire.
Output strictly a JSON array of objects with format: [{"questionId": "optional-id", "question": "Question text"}]
If no question ID is present, omit the questionId field.
Do not output anything else.`;

            const userPrompt = `Extract all security/compliance questions from this document content. 
Ignore headers, glossaries, or instructions. 
Only return the questions.

Document Content:
${truncatedText}`;

            const response = await llmService.generate({
              systemPrompt,
              userPrompt,
              temperature: 0.1,
              feature: 'question_extraction'
            });

            try {
              const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
              parsedQuestions = JSON.parse(cleanedText);
            } catch (e) {
              console.error("Failed to parse LLM JSON response for questions", e);
              // Fallback: Split by newline and try to guess questions
              parsedQuestions = textContent.split('\n')
                .filter(line => line.trim().endsWith('?'))
                .map(q => ({ question: q.trim() }));
            }

          } else if (input.fileType === 'xlsx' || input.fileType === 'csv') {
            // For Excel/CSV, try to detect structured columns
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // Get raw rows first to find the header
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (rawRows.length === 0) {
              throw new Error('No data found in spreadsheet');
            }

            // Smart Header Detection: Scan first 20 rows
            let headerRowIndex = 0;
            let maxScore = -1;

            for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
              const row = rawRows[i];
              if (!Array.isArray(row)) continue;

              let score = 0;
              row.forEach((cell: any) => {
                if (typeof cell !== 'string') return;
                const val = cell.toLowerCase().trim();

                // High value keywords
                if (val.includes('question') && val.includes('id')) score += 10;
                else if (val === 'question' || val === 'questions') score += 5;
                else if (val === 'answer' || val === 'response') score += 5;
                else if (val === 'control id' || val === 'ref #') score += 5;
                else if (val.includes('requirement')) score += 5; // SIG / Custom

                // Medium value
                else if (val === 'id') score += 2;
                else if (val.includes('status')) score += 2;
                else if (val.includes('comment')) score += 2;
                else if (val.includes('description')) score += 3; // "Control Description"
                else if (val.includes('control')) score += 2;
                else if (val.includes('assessment')) score += 2;
              });

              // Penalize empty rows
              if (row.length === 0) score = -1;

              if (score > maxScore) {
                maxScore = score;
                headerRowIndex = i;
              }
            }

            console.log(`[Questionnaire Parser] Smart Header Detection: Selected Row ${headerRowIndex} with score ${maxScore}`);

            // Re-construct jsonData based on the detected header
            const headers = rawRows[headerRowIndex].map(h => String(h || '').trim());
            const jsonData = rawRows.slice(headerRowIndex + 1).map(row => {
              const obj: any = {};
              headers.forEach((h, idx) => {
                if (h) obj[h] = row[idx];
              });
              return obj;
            });

            console.log('[Questionnaire Parser] Detected headers:', headers);
            console.log('[Questionnaire Parser] First data row sample:', jsonData[0]);

            // Find Question ID column (various naming conventions)
            const questionIdCol = headers.find(h => {
              const normalized = h.toLowerCase().trim();
              const matches = normalized === 'question id' ||
                normalized === 'questionid' ||
                normalized === 'q id' ||
                normalized === 'qid' ||
                normalized === 'item id' ||
                normalized === 'control id' ||
                normalized === 'id' ||
                normalized.includes('question') && normalized.includes('id') ||
                /question\s*id/i.test(h) ||
                /q\s*id/i.test(h);

              if (matches) {
                console.log('[Questionnaire Parser] MATCHED Question ID column:', h, '(normalized:', normalized, ')');
              }
              return matches;
            });

            console.log('[Questionnaire Parser] Question ID column:', questionIdCol);

            // Find Question column
            let questionCol = headers.find(h => {
              const normalized = h.toLowerCase().trim();
              return normalized === 'question' ||
                normalized === 'questions' ||
                normalized === 'question text' ||
                /^question$/i.test(h) ||
                /question\s*text/i.test(h);
            }) || headers.find(h => h.toLowerCase().includes('question'));

            // Fallback for other formats (SIG, Custom)
            if (!questionCol) {
              questionCol = headers.find(h => {
                const n = h.toLowerCase().trim();
                // Prioritize specific common terms
                return n === 'requirement' ||
                  n === 'description' ||
                  n.includes('control text') ||
                  n.includes('risk') || // Some use "Risk"
                  n.includes('assessment criteria');
              });
            }

            console.log('[Questionnaire Parser] Question column:', questionCol);

            if (!questionCol) {
              // Fallback: Use LLM if no clear structure
              textContent = JSON.stringify(jsonData);
              const truncatedText = textContent.substring(0, 50000);

              const systemPrompt = `Extract questions from this spreadsheet data.
Output JSON array: [{"questionId": "optional-id", "question": "Question text"}]`;

              const response = await llmService.generate({
                systemPrompt,
                userPrompt: `Extract questions from:\n${truncatedText}`,
                temperature: 0.1,
                feature: 'question_extraction'
              });

              try {
                const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedQuestions = JSON.parse(cleanedText);
              } catch (e) {
                throw new Error('Could not detect question column in spreadsheet');
              }
            } else {
              // Extract structured data
              console.log('[Questionnaire Parser] Extracting', jsonData.length, 'rows');
              parsedQuestions = jsonData
                .filter(row => row[questionCol] && String(row[questionCol]).trim())
                .map(row => {
                  const rawQId = questionIdCol ? row[questionIdCol] : null;
                  const qId = rawQId && String(rawQId).trim() ? String(rawQId).trim() : undefined;
                  const question = String(row[questionCol]).trim();
                  console.log('[Questionnaire Parser] Extracted:', {
                    questionId: qId,
                    question: question.substring(0, 50) + '...',
                    rawQuestionId: rawQId
                  });
                  return {
                    questionId: qId,
                    question: question
                  };
                });

              console.log('[Questionnaire Parser] Total extracted:', parsedQuestions.length, 'questions');
              console.log('[Questionnaire Parser] Questions with IDs:', parsedQuestions.filter(q => q.questionId).length);
            }
          } else {
            throw new Error('Unsupported file type');
          }

          return {
            success: true,
            questions: parsedQuestions
          };

        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to parse file: ${error.message}`,
          });
        }
      }),

    /**
     * Create a new Questionnaire Project
     */
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string(),
        senderName: z.string().optional(),
        productName: z.string().optional(),
        dueDate: z.string().optional(), // ISO Date string
      }))
      .mutation(async ({ input, ctx }: any) => {
        const db = await getDb();
        const [project] = await db.insert(schema.questionnaires).values({
          clientId: input.clientId,
          name: input.name,
          senderName: input.senderName,
          productName: input.productName,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          ownerId: ctx.user.id,
          status: 'open',
          progress: 0
        }).returning();

        return project;
      }),

    /**
     * Save questions to a questionnaire
     */
    saveQuestions: protectedProcedure
      .input(z.object({
        questionnaireId: z.number(),
        questions: z.array(z.object({
          questionId: z.string().nullable().optional(),
          question: z.string(),
          answer: z.string().optional(),
          confidence: z.number().optional(),
          sources: z.array(z.any()).optional(),
          status: z.string().optional()
        }))
      }))
      .mutation(async ({ input }: any) => {
        const db = await getDb();
        const { questionnaireId, questions } = input;

        // Validate input
        if (!questionnaireId || typeof questionnaireId !== 'number') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Valid questionnaire ID is required'
          });
        }

        // Compute progress before transaction
        const total = questions.length;
        const answered = questions.filter((q: any) => q.answer && q.answer.trim().length > 0).length;
        const progress = total > 0 ? Math.round((answered / total) * 100) : 0;
        const newStatus = progress === 100 ? 'completed' : (answered > 0 ? 'in_progress' : 'open');

        // Use transaction to prevent data loss on failure
        // Transaction ensures atomicity - if any operation fails, all changes are rolled back
        await db.transaction(async (tx: typeof db) => {
          // First, delete existing questions
          await tx.delete(schema.questionnaireQuestions)
            .where(eq(schema.questionnaireQuestions.questionnaireId, questionnaireId));

          // Then insert new questions (only if there are any)
          if (questions.length > 0) {
            await tx.insert(schema.questionnaireQuestions).values(
              questions.map((q: any) => ({
                questionnaireId,
                questionId: q.questionId || null,
                question: q.question,
                answer: q.answer || null,
                comment: q.comment || null,
                tags: q.tags || [],
                access: q.access || 'internal',
                assigneeId: q.assigneeId || null,
                confidence: q.confidence || null,
                sources: q.sources || [],
                status: q.status || 'pending',
                updatedAt: new Date()
              }))
            );
          }

          // Update questionnaire progress and status within the same transaction
          // This ensures questions and progress are always in sync
          await tx.update(schema.questionnaires)
            .set({
              progress,
              status: newStatus,
              updatedAt: new Date()
            })
            .where(eq(schema.questionnaires.id, questionnaireId));
        });

        return { success: true, progress };
      }),

    /**
     * List questionnaires for a client
     */
    list: protectedProcedure
      .input(z.object({
        clientId: z.number()
      }))
      .query(async ({ input }: any) => {
        const db = await getDb();
        return await db.select()
          .from(schema.questionnaires)
          .where(eq(schema.questionnaires.clientId, input.clientId))
          .orderBy(desc(schema.questionnaires.createdAt));
      }),

    /**
     * Get a single questionnaire with questions
     */
    get: protectedProcedure
      .input(z.object({
        id: z.number()
      }))
      .query(async ({ input }: any) => {
        const db = await getDb();
        const project = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.id)).limit(1);

        if (!project[0]) throw new TRPCError({ code: 'NOT_FOUND' });

        const questions = await db.select()
          .from(schema.questionnaireQuestions)
          .where(eq(schema.questionnaireQuestions.questionnaireId, input.id));

        return {
          ...project[0],
          questions
        };
      }),

    /**
     * Generate answers for a list of questions using AI and Knowledge Base
     */
    generateAnswers: premiumClientProcedure
      .input(z.object({
        clientId: z.number(),
        questions: z.array(z.union([
          z.string(),
          z.object({
            questionId: z.string().nullable().optional(),
            question: z.string()
          })
        ]))
      }))
      .mutation(async ({ input, ctx }: any) => {
        const db = await getDb();

        // Validate client access - ensure input clientId matches authenticated client's context
        // premiumClientProcedure middleware validates user has access to ctx.clientId
        // We also validate that the requested clientId matches to prevent unauthorized access
        if (!ctx.clientId || ctx.clientId !== input.clientId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Client ID mismatch or missing. Please use the correct client context.'
          });
        }

        // Normalize questions to array of objects
        const normalizedQuestions = input.questions.map((q: any) => {
          if (typeof q === 'string') {
            return { questionId: null, question: q };
          }
          return q;
        });

        // Search knowledge base for relevant entries
        const searchTerms = normalizedQuestions
          .map((q: any) => q.question.split(' ').slice(0, 5).join(' '))
          .join(' | ');

        let kbEntries: any[] = [];
        try {
          kbEntries = await db.select()
            .from(schema.knowledgeBaseEntries)
            .where(eq(schema.knowledgeBaseEntries.clientId, input.clientId))
            .limit(50);
        } catch (e) {
          console.log('[Questionnaire] No knowledge base entries found, using empty context');
        }

        // Generate answers for each question
        const results = await Promise.all(normalizedQuestions.map(async (q: any) => {
          // Find relevant KB entries for this question
          const relevantEntries = kbEntries.filter((entry: any) => {
            const searchText = `${entry.question || ''} ${entry.answer || ''}`.toLowerCase();
            const questionText = q.question.toLowerCase();
            return searchText.includes(questionText.split(' ')[0]) ||
              questionText.split(' ').some((word: string) => word.length > 3 && searchText.includes(word));
          }).slice(0, 3);

          // Build context from relevant entries
          const context = relevantEntries.length > 0
            ? relevantEntries.map((e: any) => `Q: ${e.question}\nA: ${e.answer}`).join('\n\n')
            : 'No relevant knowledge base entries found.';

          const systemPrompt = `You are a compliance assistant helping answer security questionnaire questions.
Use the provided knowledge base context to answer questions accurately and professionally.
If you don't have sufficient information, provide a general best-practice answer.
Always respond with a JSON object containing: answer (string), confidence (number 0-1), sources (array of objects with title and excerpt).`;

          const userPrompt = `Context from Knowledge Base:
${context}

Question: ${q.question}

Generate a professional answer. Response format:
{"answer": "...", "confidence": 0.0-1.0, "sources": [{"title": "...", "excerpt": "..."}]}`;

          try {
            const response = await llmService.generate({
              systemPrompt,
              userPrompt,
              temperature: 0.3,
              jsonMode: true,
              feature: 'questionnaire_answers'
            });

            // Parse the JSON response
            let parsed: any = { answer: '', confidence: 0, sources: [] };
            try {
              const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
              parsed = JSON.parse(cleanedText);
            } catch (parseErr) {
              console.error('[Questionnaire] Failed to parse LLM response:', parseErr);
              parsed = {
                answer: response.text,
                confidence: 0.3,
                sources: []
              };
            }

            // Add KB entries as sources if not already included
            const kbSources = relevantEntries.slice(0, 2).map((e: any) => ({
              title: e.question || 'Knowledge Base Entry',
              excerpt: (e.answer || '').substring(0, 200)
            }));

            return {
              questionId: q.questionId,
              question: q.question,
              answer: parsed.answer || 'Unable to generate answer',
              confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
              sources: [...kbSources, ...(parsed.sources || [])].slice(0, 5)
            };
          } catch (err) {
            console.error('[Questionnaire] Error generating answer:', err);
            return {
              questionId: q.questionId,
              question: q.question,
              answer: '',
              confidence: 0,
              sources: [],
              error: err instanceof Error ? err.message : 'Generation failed'
            };
          }
        }));

        return results;
      }),


    /**
     * Complete a questionnaire and index its answers
     */
    complete: premiumClientProcedure
      .input(z.object({ id: z.number(), clientId: z.number() }))
      .mutation(async ({ input }: any) => {
        const db = await getDb();

        const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.id));
        if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

        // Validate client access
        if (project.clientId !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire does not belong to this client' });
        }

        // Compute real progress from stored answers
        const questions = await db.select()
          .from(schema.questionnaireQuestions)
          .where(eq(schema.questionnaireQuestions.questionnaireId, input.id));

        const validAnswers = questions.filter((q: any) =>
          q.answer && q.answer.trim().length > 0 && !String(q.answer).startsWith('Error')
        );
        const indexedCount = validAnswers.length;

        await db.update(schema.questionnaires)
          .set({ status: 'completed', progress: 100, updatedAt: new Date() })
          .where(eq(schema.questionnaires.id, input.id));

        // Indexing removed for Core split — placeholder for Premium indexing
        return { success: true, indexedCount };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.string().optional(),
        progress: z.number().optional()
      }))
      .mutation(async ({ input }: any) => {
        const db = await getDb();
        await db.update(schema.questionnaires)
          .set({
            ...(input.status ? { status: input.status } : {}),
            ...(input.progress ? { progress: input.progress } : {}),
            updatedAt: new Date()
          })
          .where(eq(schema.questionnaires.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }: any) => {
        const db = await getDb();
        await db.delete(schema.questionnaires).where(eq(schema.questionnaires.id, input.id));
        return { success: true };
      }),

    /**
     * Export questionnaire to Excel format
     */
    exportExcel: protectedProcedure
      .input(z.object({ id: z.number(), clientId: z.number() }))
      .query(async ({ input }: any) => {
        const db = await getDb();

        const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.id));
        if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

        // Validate client access
        if (project.clientId !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire does not belong to this client' });
        }

        const questions = await db.select()
          .from(schema.questionnaireQuestions)
          .where(eq(schema.questionnaireQuestions.questionnaireId, input.id));

        // Build Excel data
        const rows = questions.map((q: any, idx: number) => ({
          '#': idx + 1,
          'Question ID': q.questionId || '',
          'Question': q.question,
          'Answer': q.answer || '',
          'Status': q.status || 'pending',
          'Confidence': q.confidence ? `${Math.round(q.confidence * 100)}%` : '',
          'Comment': q.comment || '',
          'Tags': (q.tags || []).join(', '),
          'Last Updated': q.updatedAt ? new Date(q.updatedAt).toISOString() : ''
        }));

        return {
          name: project.name,
          status: project.status,
          progress: project.progress,
          senderName: project.senderName,
          createdAt: project.createdAt,
          questions: rows
        };
      }),

    /**
     * Export questionnaire to JSON format (for PDF generation or further processing)
     */
    exportJSON: protectedProcedure
      .input(z.object({ id: z.number(), clientId: z.number() }))
      .query(async ({ input }: any) => {
        const db = await getDb();

        const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.id));
        if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

        // Validate client access
        if (project.clientId !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire does not belong to this client' });
        }

        const questions = await db.select()
          .from(schema.questionnaireQuestions)
          .where(eq(schema.questionnaireQuestions.questionnaireId, input.id));

        return {
          metadata: {
            name: project.name,
            status: project.status,
            progress: project.progress,
            senderName: project.senderName,
            productName: project.productName,
            dueDate: project.dueDate,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
          },
          questions: questions.map((q: any) => ({
            questionId: q.questionId,
            question: q.question,
            answer: q.answer,
            comment: q.comment,
            status: q.status,
            confidence: q.confidence,
            tags: q.tags,
            access: q.access,
            sources: q.sources,
            updatedAt: q.updatedAt
          })),
          summary: {
            totalQuestions: questions.length,
            answeredQuestions: questions.filter((q: any) => q.answer && q.answer.trim()).length,
            pendingQuestions: questions.filter((q: any) => !q.answer || !q.answer.trim()).length
          }
        };
      }),

    /**
     * List available questionnaire templates
     */
    listTemplates: premiumClientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input, ctx }: any) => {
        const db = await getDb();

        // Validate client access - ensure input clientId matches authenticated client's context
        // premiumClientProcedure middleware validates user has access to ctx.clientId
        if (!ctx.clientId || ctx.clientId !== input.clientId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Client ID mismatch or missing. Please use the correct client context.'
          });
        }

        // Fetch completed questionnaires from database that can be used as templates
        const questionnaires = await db.select({
          id: schema.questionnaires.id,
          name: schema.questionnaires.name,
          status: schema.questionnaires.status,
          progress: schema.questionnaires.progress,
          createdAt: schema.questionnaires.createdAt
        })
          .from(schema.questionnaires)
          .where(eq(schema.questionnaires.clientId, input.clientId))
          .orderBy(desc(schema.questionnaires.createdAt))
          .limit(20);

        // Get question counts for each questionnaire
        const templateList = await Promise.all(questionnaires.map(async (q: any) => {
          const questions = await db.select({ id: schema.questionnaireQuestions.id })
            .from(schema.questionnaireQuestions)
            .where(eq(schema.questionnaireQuestions.questionnaireId, q.id));
          return {
            id: q.id.toString(),
            name: q.name,
            description: `Use questions from "${q.name}" as a template`,
            framework: 'Custom',
            questionCount: questions.length,
            category: 'Custom Templates'
          };
        }));

        // Add built-in templates as options
        const builtInTemplates = [
          {
            id: 'sig-lite',
            name: 'SIG Lite',
            description: 'Standardized Information Gathering (SIG) Lite questionnaire for vendor assessment',
            framework: 'SIG',
            questionCount: 15,
            category: 'Vendor Assessment'
          },
          {
            id: 'caiq-v4',
            name: 'CAIQ v4',
            description: 'Cloud Controls Matrix (CCM) v4 Assessment for cloud service providers',
            framework: 'CSA',
            questionCount: 8,
            category: 'Cloud Security'
          },
          {
            id: 'iso27001-baseline',
            name: 'ISO 27001 Baseline',
            description: 'Basic ISO 27001 control assessment questionnaire',
            framework: 'ISO 27001',
            questionCount: 11,
            category: 'Certification'
          },
          {
            id: 'nist-csf',
            name: 'NIST CSF',
            description: 'NIST Cybersecurity Framework assessment',
            framework: 'NIST',
            questionCount: 11,
            category: 'Framework'
          },
          {
            id: 'soc2-type2',
            name: 'SOC 2 Type II',
            description: 'SOC 2 Trust Service Criteria assessment',
            framework: 'SOC 2',
            questionCount: 9,
            category: 'Certification'
          },
          {
            id: 'pentest-scope',
            name: 'Penetration Testing Scope',
            description: 'Initial scope questionnaire for penetration testing engagements',
            framework: 'Security',
            questionCount: 8,
            category: 'Security Assessment'
          },
          {
            id: 'gdpr-readiness',
            name: 'GDPR Readiness',
            description: 'General Data Protection Regulation compliance assessment',
            framework: 'GDPR',
            questionCount: 8,
            category: 'Privacy'
          },
          {
            id: 'hipaa-security',
            name: 'HIPAA Security Rule',
            description: 'HIPAA Security Rule compliance assessment',
            framework: 'HIPAA',
            questionCount: 9,
            category: 'Healthcare'
          }
        ];

        return [...templateList, ...builtInTemplates];
      }),

    /**
     * Get template questions
     */
    getTemplateQuestions: protectedProcedure
      .input(z.object({ templateId: z.string() }))
      .query(async ({ input }: any) => {
        const db = await getDb();

        // If templateId is a number, treat it as an existing questionnaire ID and fetch its questions
        const templateIdNum = parseInt(input.templateId, 10);
        if (!isNaN(templateIdNum)) {
          // Fetch questions from an existing questionnaire
          const questions = await db.select()
            .from(schema.questionnaireQuestions)
            .where(eq(schema.questionnaireQuestions.questionnaireId, templateIdNum));

          // Group questions by category or use default
          const categoryMap = new Map<string, typeof questions>();
          questions.forEach((q: any) => {
            const cat = q.category || 'General';
            if (!categoryMap.has(cat)) {
              categoryMap.set(cat, []);
            }
            categoryMap.get(cat)!.push(q);
          });

          const result: Array<{ questionId: string; question: string; category?: string }> = [];
          categoryMap.forEach((qs, category) => {
            qs.forEach((q: any) => {
              result.push({
                questionId: q.questionId || `q${q.id}`,
                question: q.question,
                category: category
              });
            });
          });

          return result;
        }

        // Otherwise, return predefined questions for built-in templates
        const templates: Record<string, Array<{ questionId: string; question: string; category?: string }>> = {
          'sig-lite': [
            { questionId: 'A&A-01', question: 'Does the vendor have a documented information security policy?', category: 'Security Policy' },
            { questionId: 'A&A-02', question: 'Is the information security policy reviewed at least annually?', category: 'Security Policy' },
            { questionId: 'A&A-03', question: 'Does the vendor have an appointed Chief Information Security Officer (CISO)?', category: 'Governance' },
            { questionId: 'AC-01', question: 'Does the vendor maintain an inventory of all authorized users?', category: 'Access Control' },
            { questionId: 'AC-02', question: 'Is access to systems and data based on the principle of least privilege?', category: 'Access Control' },
            { questionId: 'AC-03', question: 'Are user accounts disabled or removed immediately upon termination?', category: 'Access Control' },
            { questionId: 'AC-04', question: 'Does the vendor implement multi-factor authentication for privileged access?', category: 'Access Control' },
            { questionId: 'BC-01', question: 'Does the vendor have a documented business continuity plan?', category: 'Business Continuity' },
            { questionId: 'BC-02', question: 'Is the business continuity plan tested annually?', category: 'Business Continuity' },
            { questionId: 'DS-01', question: 'Is data classified based on sensitivity and criticality?', category: 'Data Security' },
            { questionId: 'DS-02', question: 'Is data encrypted at rest using industry-standard algorithms?', category: 'Data Security' },
            { questionId: 'DS-03', question: 'Is data encrypted in transit using TLS 1.2 or higher?', category: 'Data Security' },
            { questionId: 'IR-01', question: 'Does the vendor have an incident response plan?', category: 'Incident Response' },
            { questionId: 'IR-02', question: 'Is the incident response plan tested annually?', category: 'Incident Response' },
            { questionId: 'IR-03', question: 'Does the vendor notify customers of data breaches within 72 hours?', category: 'Incident Response' }
          ],
          'caiq-v4': [
            { questionId: 'CCC-01', question: 'Does the cloud provider implement encryption for data at rest?', category: 'Cryptography' },
            { questionId: 'CCC-02', question: 'Does the cloud provider support customer-managed encryption keys?', category: 'Cryptography' },
            { questionId: 'EKM-01', question: 'Does the cloud provider allow export of data in a standard format?', category: 'Data Portability' },
            { questionId: 'IAM-01', question: 'Does the cloud provider support role-based access control (RBAC)?', category: 'Identity & Access' },
            { questionId: 'IAM-02', question: 'Does the cloud provider support multi-factor authentication?', category: 'Identity & Access' },
            { questionId: 'SEC-01', question: 'Does the cloud provider perform vulnerability scans?', category: 'Security' },
            { questionId: 'SEC-02', question: 'Does the cloud provider perform penetration testing?', category: 'Security' },
            { questionId: 'BCR-01', question: 'Does the cloud provider have a disaster recovery plan?', category: 'Business Continuity' }
          ],
          'iso27001-baseline': [
            { questionId: 'A.5.1', question: 'Are there information security policies and procedures?', category: 'Policy' },
            { questionId: 'A.6.1', question: 'Is there a management framework for information security?', category: 'Organization' },
            { questionId: 'A.7.1', question: 'Are human resource security requirements implemented?', category: 'Human Resources' },
            { questionId: 'A.8.1', question: 'Are assets managed appropriately?', category: 'Assets' },
            { questionId: 'A.9.1', question: 'Is there an access control policy?', category: 'Access Control' },
            { questionId: 'A.10.1', question: 'Is cryptography used to protect information?', category: 'Cryptography' },
            {
              questionId: 'A.11.1', question: 'Are physical and environmental security controls in place?', category: 'Physical Security'
            },
            { questionId: 'A.12.1', question: 'Are operational procedures and responsibilities documented?', category: 'Operations' },
            { questionId: 'A.13.1', question: 'Is there network security management?', category: 'Communications' }
          ],
          'nist-csf': [
            { questionId: 'ID.AM-1', question: 'Are physical devices and systems within the organization inventoried?', category: 'Identify' },
            { questionId: 'ID.AM-2', question: 'Are software platforms and applications inventoried?', category: 'Identify' },
            { questionId: 'ID.BE-1', question: 'Is the organizational role in the supply chain defined?', category: 'Identify' },
            { questionId: 'ID.GV-1', question: 'Are organizational cybersecurity policies established?', category: 'Identify' },
            { questionId: 'PR.AC-1', question: 'Are identities and credentials managed?', category: 'Protect' },
            { questionId: 'PR.AC-2', question: 'Is physical access to assets managed?', category: 'Protect' },
            { questionId: 'PR.DS-1', question: 'Is data-at-rest protected?', category: 'Protect' },
            { questionId: 'PR.DS-2', question: 'Is data-in-transit protected?', category: 'Protect' },
            { questionId: 'DE.AE-1', question: 'Is a baseline of network operations established?', category: 'Detect' },
            { questionId: 'RS.RP-1', question: 'Is there an incident response plan?', category: 'Respond' },
            { questionId: 'RC.RP-1', question: 'Is there a recovery plan?', category: 'Recover' }
          ],
          'soc2-type2': [
            { questionId: 'CC1.1', question: 'Does the entity demonstrate a commitment to integrity and ethical values?', category: 'Control Environment' },
            { questionId: 'CC2.1', question: 'Does the entity communicate internally regarding objectives and responsibilities?', category: 'Communication & Info' },
            { questionId: 'CC3.1', question: 'Does the entity specify objectives with sufficient clarity?', category: 'Risk Assessment' },
            { questionId: 'CC4.1', question: 'Does the entity identify and analyze risks?', category: 'Risk Assessment' },
            { questionId: 'CC5.1', question: 'Does the entity select and develop control activities?', category: 'Control Activities' },
            { questionId: 'CC6.1', question: 'Does the entity select and develop general controls over technology?', category: 'Control Activities' },
            { questionId: 'CC7.1', question: 'Does the entity perform ongoing evaluations?', category: 'Monitoring' },
            { questionId: 'CC8.1', question: 'Does the entity evaluate and communicate deficiencies?', category: 'Monitoring' },
            { questionId: 'A1.1', question: 'Are availability commitments and system requirements defined?', category: 'Availability' }
          ],
          'pentest-scope': [
            { questionId: 'SCOPE-01', question: 'What is the scope of the penetration test (IP ranges, domains)?', category: 'Scope' },
            { questionId: 'SCOPE-02', question: 'Are there any systems that should NOT be tested?', category: 'Scope' },
            { questionId: 'SCOPE-03', question: 'What type of penetration test is required (black box, gray box, white box)?', category: 'Type' },
            { questionId: 'CRED-01', question: 'Will testing credentials be provided?', category: 'Credentials' },
            { questionId: 'CRED-02', question: 'What level of access will be provided (user, admin)?', category: 'Credentials' },
            { questionId: 'NET-01', question: 'Are there any third-party connections to consider?', category: 'Network' },
            { questionId: 'WEB-01', question: 'Are there web applications in scope?', category: 'Applications' },
            { questionId: 'API-01', question: 'Are there APIs in scope?', category: 'Applications' }
          ],
          'gdpr-readiness': [
            { questionId: 'GDPR-01', question: 'Is there a process for handling data subject requests?', category: 'Rights' },
            { questionId: 'GDPR-02', question: 'Is there a record of processing activities?', category: 'Accountability' },
            { questionId: 'GDPR-03', question: 'Is there a designated Data Protection Officer?', category: 'Governance' },
            { questionId: 'GDPR-04', question: 'Is data minimization practiced?', category: 'Principles' },
            { questionId: 'GDPR-05', question: 'Is consent obtained where required?', category: 'Lawfulness' },
            { questionId: 'GDPR-06', question: 'Is there a process for breach notification?', category: 'Security' },
            { questionId: 'GDPR-07', question: 'Are data processing agreements in place?', category: 'Contracts' },
            { questionId: 'GDPR-08', question: 'Is privacy by design implemented?', category: 'Principles' }
          ],
          'hipaa-security': [
            { questionId: '164.308(a)(1)', question: 'Is there a security management process?', category: 'Administrative' },
            { questionId: '164.308(a)(3)', question: 'Are workforce access controls implemented?', category: 'Administrative' },
            { questionId: '164.308(a)(5)', question: 'Is security awareness training provided?', category: 'Administrative' },
            { questionId: '164.308(a)(7)', question: 'Is there a contingency plan?', category: 'Administrative' },
            { questionId: '164.310(a)(1)', question: 'Are physical safeguards implemented?', category: 'Physical' },
            { questionId: '164.310(d)(1)', question: 'Is device and media controls implemented?', category: 'Physical' },
            { questionId: '164.312(a)(1)', question: 'Is access control implemented?', category: 'Technical' },
            { questionId: '164.312(b)', question: 'Is audit control implemented?', category: 'Technical' },
            { questionId: '164.312(d)', question: 'Is person or entity authentication implemented?', category: 'Technical' },
            { questionId: '164.312(e)(1)', question: 'Is transmission security implemented?', category: 'Technical' }
          ]
        };

        return templates[input.templateId] || [];
      }),

    /**
     * Approve a specific question answer
     */
    approveQuestion: protectedProcedure
      .input(z.object({
        questionnaireId: z.number(),
        questionId: z.number(),
        clientId: z.number(),
        comment: z.string().optional()
      }))
      .mutation(async ({ input, ctx }: any) => {
        const db = await getDb();

        // Validate client access
        const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.questionnaireId));
        if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
        if (project.clientId !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire does not belong to this client' });
        }

        await db.update(schema.questionnaireQuestions)
          .set({
            status: 'approved',
            approvedBy: ctx.user.id,
            approvedAt: new Date(),
            comment: input.comment || null,
            updatedAt: new Date()
          })
          .where(eq(schema.questionnaireQuestions.id, input.questionId));

        return { success: true };
      }),

    /**
     * Flag a question for review
     */
    flagQuestion: protectedProcedure
      .input(z.object({
        questionnaireId: z.number(),
        questionId: z.number(),
        clientId: z.number(),
        reason: z.string()
      }))
      .mutation(async ({ input }: any) => {
        const db = await getDb();

        // Validate client access
        const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.questionnaireId));
        if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
        if (project.clientId !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire does not belong to this client' });
        }

        await db.update(schema.questionnaireQuestions)
          .set({
            status: 'needs_review',
            comment: input.reason,
            updatedAt: new Date()
          })
          .where(eq(schema.questionnaireQuestions.id, input.questionId));

        return { success: true };
      }),

    /**
     * Submit questionnaire for approval (change status to pending_review)
     */
    submitForReview: protectedProcedure
      .input(z.object({ id: z.number(), clientId: z.number() }))
      .mutation(async ({ input }: any) => {
        const db = await getDb();

        // Validate client access
        const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.id));
        if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
        if (project.clientId !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire does not belong to this client' });
        }

        await db.update(schema.questionnaires)
          .set({ status: 'pending_review', updatedAt: new Date() })
          .where(eq(schema.questionnaires.id, input.id));

        return { success: true };
      }),

    /**
     * Generate a shareable link for vendor to complete questionnaire
     */
    generateVendorLink: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
        vendorEmail: z.string().email(),
        vendorName: z.string(),
        expiresInDays: z.number().min(1).max(365).default(30)
      }))
      .mutation(async ({ input }: any) => {
        const db = await getDb();

        // Validate client access
        const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.id));
        if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
        if (project.clientId !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire does not belong to this client' });
        }

        // Use shared helper to generate or reuse token
        const { token, expiresAt } = await ensureVendorToken(
          db, input.id, input.vendorEmail, input.vendorName, input.expiresInDays
        );

        // Generate the shareable URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const vendorLink = `${baseUrl}/questionnaire/${token}`;

        return {
          success: true,
          vendorLink,
          expiresAt: expiresAt?.toISOString()
        };
      }),

    /**
     * Send vendor link via email
     */
    sendVendorInvite: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
        vendorEmail: z.string().email(),
        vendorName: z.string(),
        message: z.string().optional(),
        expiresInDays: z.number().min(1).max(365).default(30)
      }))
      .mutation(async ({ input, ctx }: any) => {
        const db = await getDb();

        // Validate client access
        const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.id));
        if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
        if (project.clientId !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire does not belong to this client' });
        }

        // Use shared helper to generate or reuse token
        const { token, expiresAt } = await ensureVendorToken(
          db, input.id, input.vendorEmail, input.vendorName, input.expiresInDays
        );

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const vendorLink = `${baseUrl}/questionnaire/${token}`;

        // Create email record in the communication system
        let emailSent = false;
        try {
          await db.insert(schema.emailMessages).values({
            clientId: input.clientId,
            userId: ctx.user.id,
            folder: 'sent',
            status: 'sent',
            subject: `Security Questionnaire: ${project.name}`,
            body: `Hello,\n\nPlease complete the security questionnaire for ${project.name}.\n\nQuestionnaire Link: ${vendorLink}\n\nThis link will expire on ${expiresAt.toLocaleDateString()}.\n\n${input.message || ''}\n\nBest regards,\nSecurity Team`,
            to: [input.vendorEmail],
            from: ctx.user.email ?? process.env.DEFAULT_FROM_EMAIL ?? "noreply@complianceos.com",
            isRead: true
          });

          // ACTUALLY SEND THE EMAIL VIA SENDGRID OR SMTP
          const htmlBody = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
              <div style="background-color: #f8fafc; padding: 20px; border-bottom: 3px solid #4f46e5; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; color: #1e293b;">Security Assessment Request</h2>
              </div>
              <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                <p>Hello${input.vendorName ? ` ${input.vendorName}` : ''},</p>
                <p>You have been requested to complete the security assessment for <strong>${project.name}</strong>.</p>
                ${input.message ? `<div style="background-color: #eff6ff; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0; font-weight: 500;">Note from sender: "${input.message}"</div>` : ''}
                <div style="margin: 32px 0; text-align: center;">
                  <a href="${vendorLink}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Start Assessment</a>
                </div>
                <p style="font-size: 14px; color: #64748b;">This secure link is unique to you and will expire on ${expiresAt.toLocaleDateString()}. You can use this link to save your progress and return anytime.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="margin: 0;">Best regards,</p>
                <p style="margin: 4px 0 0 0; font-weight: 500; color: #1e293b;">The Security Team</p>
              </div>
            </div>
          `;

          await sendEmail({
            to: input.vendorEmail,
            subject: `Security Assessment Request: ${project.name}`,
            html: htmlBody,
            clientId: input.clientId,
            from: ctx.user.email ?? process.env.DEFAULT_FROM_EMAIL
          });

          emailSent = true;
        } catch (e) {
          // Log error but don't fail the main operation
          console.error('[Email] Failed to create or send email:', e);
        }

        return {
          success: true,
          vendorLink,
          expiresAt: expiresAt.toISOString(),
          emailSent,
          message: emailSent
            ? "Vendor invite sent and recorded in communications."
            : "Link generated successfully. Email delivery failed - please send manually."
        };
      }),

    // --- PUBLIC ENDPOINTS FOR VENDOR PORTAL ---

    getByVendorToken: publicProcedure
      .input(z.object({ token: z.string().min(1).max(128) }))
      .use(async ({ ctx, next }: any) => {
        // Apply rate limiting based on IP (use forwarded header if behind proxy)
        const ip = ctx.headers?.['x-forwarded-for']?.split(',')[0] ||
          ctx.headers?.['x-real-ip'] ||
          'unknown';
        const identifier = `vendor_get:${ip}`;

        if (await checkRateLimit(identifier)) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.'
          });
        }

        return next();
      })
      .query(async ({ input }: any) => {
        const db = await getDb();
        const [project] = await db.select().from(schema.questionnaires)
          .where(eq(schema.questionnaires.vendorToken, input.token)).limit(1);

        // SECURITY: Return the same error for both invalid token and expired token
        // to prevent token enumeration attacks
        if (!project || !project.vendorToken) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
        }

        // Validate token expiration - return same error as invalid token
        if (project.vendorLinkExpiresAt && new Date(project.vendorLinkExpiresAt) < new Date()) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
        }

        const questions = await db.select().from(schema.questionnaireQuestions)
          .where(eq(schema.questionnaireQuestions.questionnaireId, project.id));

        return { ...project, questions };
      }),

    submitVendorResponses: publicProcedure
      .input(z.object({
        token: z.string().min(1).max(128),
        responses: z.array(z.object({
          id: z.number(),
          answer: z.string().min(1).max(50000),
          comment: z.string().max(10000).optional()
        })),
        submit: z.boolean().optional()
      }))
      .use(async ({ ctx, next }: any) => {
        // Apply rate limiting based on token/IP
        // More restrictive for submission endpoint
        const ip = ctx.headers?.['x-forwarded-for']?.split(',')[0] ||
          ctx.headers?.['x-real-ip'] ||
          'unknown';
        const identifier = `vendor_submit:${ip}`;

        // More restrictive limit for submissions
        const submitLimit = VENDOR_PORTAL_SUBMIT_LIMIT;
        const isLimited = await rateLimiter.isRateLimited(identifier, submitLimit, VENDOR_PORTAL_RATE_WINDOW_MS);

        if (isLimited) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many submission attempts. Please try again later.'
          });
        }

        return next();
      })
      .mutation(async ({ input }: any) => {
        const db = await getDb();
        const [project] = await db.select().from(schema.questionnaires)
          .where(eq(schema.questionnaires.vendorToken, input.token)).limit(1);

        // SECURITY: Return the same error for both invalid token and expired token
        // to prevent token enumeration attacks
        if (!project || !project.vendorToken) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
        }

        // Validate token expiration - return same error as invalid token
        if (project.vendorLinkExpiresAt && new Date(project.vendorLinkExpiresAt) < new Date()) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
        }

        // SECURITY: Validate that all question IDs belong to this questionnaire
        const questions = await db.select().from(schema.questionnaireQuestions)
          .where(eq(schema.questionnaireQuestions.questionnaireId, project.id));

        const validQuestionIds = new Set(questions.map((q: any) => q.id));
        const invalidIds = input.responses.filter((r: any) => !validQuestionIds.has(r.id));
        if (invalidIds.length > 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid question IDs submitted' });
        }

        // Explicit server-side validation for answer lengths (defense-in-depth)
        const MAX_ANSWER_LENGTH = 50000;
        const MAX_COMMENT_LENGTH = 10000;
        for (const resp of input.responses) {
          if (resp.answer && resp.answer.length > MAX_ANSWER_LENGTH) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Answer exceeds maximum length of ${MAX_ANSWER_LENGTH} characters`
            });
          }
          if (resp.comment && resp.comment.length > MAX_COMMENT_LENGTH) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Comment exceeds maximum length of ${MAX_COMMENT_LENGTH} characters`
            });
          }
        }

        await db.transaction(async (tx: typeof db) => {
          for (const resp of input.responses) {
            await tx.update(schema.questionnaireQuestions)
              .set({ answer: resp.answer, comment: resp.comment })
              .where(eq(schema.questionnaireQuestions.id, resp.id));
          }

          // Compute progress
          const updatedQuestions = await tx.select().from(schema.questionnaireQuestions)
            .where(eq(schema.questionnaireQuestions.questionnaireId, project.id));

          const total = updatedQuestions.length;
          const answered = updatedQuestions.filter((q: any) => q.answer && q.answer.trim().length > 0).length;
          const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

          let newStatus = project.status;
          if (input.submit) {
            newStatus = 'pending_review';
          } else if (progress > 0 && project.status === 'vendor_pending') {
            newStatus = 'in_progress';
          }

          await tx.update(schema.questionnaires)
            .set({ progress, status: newStatus, updatedAt: new Date() })
            .where(eq(schema.questionnaires.id, project.id));
        });

        return { success: true };
      })
  });
}

