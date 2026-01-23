export interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    verified?: boolean;
    actions?: boolean;
    isLoading?: boolean;
}

// User types for authentication
export interface User {
    id: string;
    username: string;
    createdAt: number;
}

export interface StoredUser extends User {
    passwordHash: string;
}

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    tag: string;
    color: 'red' | 'blue' | 'emerald' | 'amber' | 'purple';
    // Metadata fields
    topic: string;
    category: string;
    subcategory: string;
    createdAt: number;
    createdBy?: string;
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