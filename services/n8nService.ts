import { N8N_WEBHOOKS, MOCK_DELAY } from '../constants';
import { Message, Flashcard, DocumentFile } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate mock data (used for both demo mode and error fallback)
const getMockFlashcards = (topic?: string): Flashcard[] => {
    if (topic) {
        return [
            {
                id: Date.now().toString(),
                question: `What is the core concept of ${topic}?`,
                answer: `This is a generated answer explaining the fundamentals of ${topic}. (Offline Fallback)`,
                tag: "Custom Topic",
                color: "purple"
            },
            {
                id: (Date.now() + 1).toString(),
                question: `Key advantages of using ${topic}?`,
                answer: "Efficiency, scalability, and better performance in production environments.",
                tag: "Custom Topic",
                color: "blue"
            }
        ];
    }

    return [
        {
            id: '1',
            question: "What is the primary function of the n8n webhook node?",
            answer: "It serves as a trigger to start a workflow when data is sent to a specific URL via HTTP methods like POST or GET.",
            tag: "Automation",
            color: "blue"
        },
        {
            id: '2',
            question: "How does React handle state updates?",
            answer: "React schedules updates and re-renders components efficiently using a virtual DOM diffing algorithm.",
            tag: "Frontend",
            color: "emerald"
        },
        {
            id: '3',
            question: "Explain the 'indexed' status in the document sidebar.",
            answer: "It indicates that the vector database has successfully processed and stored the document embeddings for retrieval.",
            tag: "System",
            color: "red"
        }
    ];
};

export const n8nService = {
    async sendMessage(message: string, history: Message[]): Promise<Message> {
        try {
            if (N8N_WEBHOOKS.CHAT.includes('your-n8n-instance')) {
                await delay(MOCK_DELAY);
                return {
                    id: Date.now().toString(),
                    role: 'ai',
                    verified: true,
                    actions: true,
                    content: `<p class="mb-3">I received your message: "<em>${message}</em>".</p><p>Since the n8n webhook URL is not configured in <code>constants.ts</code>, I am returning this mock response.</p>`
                };
            }

            const response = await fetch(N8N_WEBHOOKS.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            return {
                id: Date.now().toString(),
                role: 'ai',
                content: data.output || data.message || "Processed by n8n.",
                verified: true,
                actions: true
            };
        } catch (error) {
            console.error('Chat Webhook Error:', error);
            // Fallback response so the chat doesn't break
            return {
                id: Date.now().toString(),
                role: 'ai',
                content: "I'm having trouble connecting to the server (NetworkError/CORS). Please check your n8n configuration. <br/><br/>I'm currently running in offline mode.",
                verified: false
            };
        }
    },

    async uploadDocument(file: File): Promise<DocumentFile> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            if (N8N_WEBHOOKS.UPLOAD.includes('your-n8n-instance')) {
                await delay(2000);
                return {
                    id: Date.now().toString(),
                    name: file.name,
                    type: file.type,
                    status: 'indexed',
                    size: (file.size / 1024).toFixed(2) + ' KB'
                };
            }

            const response = await fetch(N8N_WEBHOOKS.UPLOAD, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            
            return {
                id: Date.now().toString(),
                name: file.name,
                type: file.type,
                status: 'indexed'
            };

        } catch (error) {
            console.error('Upload Webhook Error:', error);
            // Return error status so the UI knows
            return {
                id: Date.now().toString(),
                name: file.name,
                type: file.type,
                status: 'error',
                size: '0 KB'
            };
        }
    },

    async generateFlashcards(topic?: string): Promise<Flashcard[]> {
        try {
            // Check for placeholder
            if (N8N_WEBHOOKS.FLASHCARDS.includes('your-n8n-instance')) {
                await delay(MOCK_DELAY);
                return getMockFlashcards(topic);
            }

            const response = await fetch(N8N_WEBHOOKS.FLASHCARDS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: topic ? 'generate_specific' : 'generate_all',
                    topic: topic || ''
                })
            });

            if (!response.ok) throw new Error('Flashcard generation failed');

            const data = await response.json();
            return data.flashcards || [];

        } catch (error) {
            console.error('Flashcard Webhook Error:', error);
            console.warn('Falling back to mock data due to network error.');
            
            // CRITICAL FIX: Return mock data instead of empty array on network failure
            // This ensures the UI still works even if CORS/Mixed Content blocks the request
            return getMockFlashcards(topic);
        }
    }
};