export interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    verified?: boolean;
    actions?: boolean;
    isLoading?: boolean;
}

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    tag: string;
    color: 'red' | 'blue' | 'emerald' | 'amber' | 'purple';
}

export interface DocumentFile {
    id: string;
    name: string;
    type: string;
    status: 'uploading' | 'indexed' | 'error';
    size?: string;
}

export interface WebhookConfig {
    chatUrl: string;
    uploadUrl: string;
    flashcardsUrl: string;
}