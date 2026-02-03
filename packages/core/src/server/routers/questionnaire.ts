import { z } from "zod";
import { TRPCError } from "@trpc/server";
// import { askQuestion } from '../../lib/advisor/service';
import * as XLSX from 'xlsx';
import { llmService } from '../../lib/llm/service';
import { getDb } from '../../db';
import * as schema from '../../schema';
import { eq, desc, inArray } from "drizzle-orm";
// import { IndexingService } from '../../lib/advisor/indexing';

// Helper to parse file content validation
const FileInputSchema = z.object({
  fileBase64: z.string(),
  filename: z.string(),
  fileType: z.enum(['pdf', 'xlsx', 'csv', 'docx'])
});

export function createQuestionnaireRouter(t: any, protectedProcedure: any, premiumClientProcedure: any) {
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
          ownerId: ctx.user?.id,
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

        // Transactionally replace questions or update? 
        // For simplicity, we'll just insert new ones or update if we had IDs.
        // Assuming this is used after initial parse or full save.
        // For now, let's just nuke existing and re-insert (simple sync) or insert if new.
        // ACTUALLY, "Review" page updates specific answers.

        // Strategy: If "bulk", delete all and insert? No, that loses history.
        // Let's assume we append for now or this is the "Initial Setup".
        // Better: Check if questions exist. If empty, bulk insert.

        const existing = await db.select().from(schema.questionnaireQuestions).where(eq(schema.questionnaireQuestions.questionnaireId, input.questionnaireId));

        if (existing.length === 0) {
          await db.insert(schema.questionnaireQuestions).values(
            input.questions.map((q: any) => ({
              questionnaireId: input.questionnaireId,
              questionId: q.questionId || null,
              question: q.question,
              answer: q.answer || null,
              comment: q.comment || null,
              tags: q.tags || [],
              access: q.access || 'internal',
              assigneeId: q.assigneeId || null,
              confidence: q.confidence || null,
              sources: q.sources || [],
              status: q.status || 'pending'
            }))
          );
        } else {
          // Update logic would go here, or we treat this as "add more questions"
          // For MVP, simplistic "add if not exists" or just append.
          // Let's just append for now to avoid complexity in this step.
          await db.insert(schema.questionnaireQuestions).values(
            input.questions.map((q: any) => ({
              questionnaireId: input.questionnaireId,
              questionId: q.questionId || null,
              question: q.question,
              answer: q.answer || null,
              comment: q.comment || null,
              tags: q.tags || [],
              access: q.access || 'internal',
              assigneeId: q.assigneeId || null,
              confidence: q.confidence || null,
              sources: q.sources || [],
              status: q.status || 'pending'
            }))
          );
        }

        return { success: true };
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
     * Generate answers for a list of questions
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
      .mutation(async ({ input }: any) => {
        throw new Error("AI Answer Generation is a Premium feature.");
      }),


    /**
     * Complete a questionnaire and index its answers
     */
    complete: premiumClientProcedure
      .input(z.object({ id: z.number(), clientId: z.number() }))
      .mutation(async ({ input }: any) => {
        const db = await getDb();

        // 1. Get Project for clientId
        const [project] = await db.select().from(schema.questionnaires).where(eq(schema.questionnaires.id, input.id));
        if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

        // 2. Update status
        await db.update(schema.questionnaires)
          .set({ status: 'completed', progress: 100, updatedAt: new Date() })
          .where(eq(schema.questionnaires.id, input.id));

        // 3. Fetch answers
        const questions = await db.select()
          .from(schema.questionnaireQuestions)
          .where(eq(schema.questionnaireQuestions.questionnaireId, input.id));

        // 4. Index valid answers
        let indexedCount = 0;
        const validQuestions = questions.filter((q: any) =>
          q.answer &&
          q.answer.trim().length > 10 &&
          !String(q.answer).startsWith('Error')
        );

        // 4. Indexing removed for Core split
        // await Promise.all(validQuestions.map(async (q: any) => {
        //   try {
        //     const content = `Question: ${q.question}\nAnswer: ${q.answer}`;
        //     await IndexingService.indexDocument(...)
        //   } catch (e) {}
        // }));

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
      })
  });
}
