
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// We'll dynamically import AWS SDK to avoid breaking if not installed, 
// but we'll implement the logic assuming it might be added or using a placeholder for now.
// For a production-ready "Enterprise" build, we would definitely want @aws-sdk/client-s3.

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

export interface IStorageProvider {
    save(key: string, data: Buffer | string, contentType?: string): Promise<string>;
    get(key: string): Promise<Buffer>;
    delete(key: string): Promise<void>;
    getSignedUrl?(key: string): Promise<string>;
}

class LocalStorageProvider implements IStorageProvider {
    private baseDir: string;

    constructor() {
        this.baseDir = path.join(process.cwd(), 'storage', 'uploads');
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    async save(key: string, data: Buffer | string): Promise<string> {
        const fullPath = path.join(this.baseDir, key);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
        await writeFile(fullPath, data);
        return `/api/storage/${key}`; // Local dev path
    }

    async get(key: string): Promise<Buffer> {
        const fullPath = path.join(this.baseDir, key);
        return await readFile(fullPath);
    }

    async delete(key: string): Promise<void> {
        const fullPath = path.join(this.baseDir, key);
        if (fs.existsSync(fullPath)) {
            await unlink(fullPath);
        }
    }
}

// Enterprise S3 Provider (Skeleton - would require @aws-sdk/client-s3)
class S3StorageProvider implements IStorageProvider {
    private bucket: string;
    private region: string;

    constructor() {
        this.bucket = process.env.S3_BUCKET_NAME || '';
        this.region = process.env.AWS_REGION || 'us-east-1';
        console.log(`[Storage] Initializing S3 Provider for bucket: ${this.bucket}`);
    }

    async save(key: string, data: Buffer | string, contentType?: string): Promise<string> {
        // Implementation would use S3Client.send(new PutObjectCommand(...))
        console.log(`[S3 MOCK] Saving ${key} to ${this.bucket}`);
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }

    async get(key: string): Promise<Buffer> {
        console.log(`[S3 MOCK] Getting ${key} from ${this.bucket}`);
        return Buffer.from("S3 content placeholder");
    }

    async delete(key: string): Promise<void> {
        console.log(`[S3 MOCK] Deleting ${key} from ${this.bucket}`);
    }
}

export class StorageService {
    private static instance: IStorageProvider;

    static getInstance(): IStorageProvider {
        if (!this.instance) {
            const useS3 = !!process.env.S3_BUCKET_NAME && !!process.env.AWS_ACCESS_KEY_ID;
            this.instance = useS3 ? new S3StorageProvider() : new LocalStorageProvider();
            console.log(`[Storage] Selected Provider: ${this.instance.constructor.name}`);
        }
        return this.instance;
    }
}

export const storage = StorageService.getInstance();
