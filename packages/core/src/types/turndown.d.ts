declare module 'turndown' {
    export default class TurndownService {
        constructor(options?: any);
        addRule(key: string, rule: any): this;
        keep(filter: string | string[]): this;
        remove(filter: string | string[]): this;
        use(plugin: any | any[]): this;
        turndown(html: string): string;
    }
}
