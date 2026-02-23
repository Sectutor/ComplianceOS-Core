export interface Regulation {
    id: string;
    name: string;
    description: string;
    type: string;
    logo?: string;
    articles: Article[];
    questions?: Question[];
    link?: string;
}

export interface Article {
    id: string;
    numericId: string;
    title: string;
    description: string;
    subArticles?: SubArticle[];
    mappedControls?: Record<string, string[]>;
}

export interface SubArticle {
    id: string;
    title: string;
    description: string;
    mappedControls?: Record<string, string[]>;
}

export interface Question {
    id: string;
    text: string;
    type: string;
    options?: string[];
    relatedArticles?: string[];
    section?: string;
    subSection?: string;
    boolean?: boolean;
}
