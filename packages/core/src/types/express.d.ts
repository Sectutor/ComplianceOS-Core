
import { User } from '../schema';

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
