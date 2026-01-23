import { N8N_WEBHOOKS, MOCK_DELAY } from '../constants';
import { Message, Flashcard, DocumentFile } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to convert File to Base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data:application/pdf;base64, or data:text/plain;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
};

// Helper to generate session storage key with userId
const getSessionKey = (userId?: string) => userId ? `chat_session_${userId}` : 'chat_session_id';

// Helper to generate mock data (used for both demo mode and error fallback)
const getMockFlashcards = (topic?: string, count: number = 3): Flashcard[] => {
    const mockCards: Flashcard[] = [];
    const colors: Array<'red' | 'blue' | 'emerald' | 'amber' | 'purple'> = ['red', 'blue', 'emerald', 'amber', 'purple'];

    if (topic) {
        for (let i = 0; i < count; i++) {
            mockCards.push({
                id: `${Date.now()}-${i}`,
                question: `Question ${i + 1} about ${topic}?`,
                answer: `This is a generated answer explaining aspect ${i + 1} of ${topic}. (Offline Fallback)`,
                tag: "Custom Topic",
                color: colors[i % colors.length],
                topic: topic,
                category: "General",
                subcategory: "",
                createdAt: Date.now()
            });
        }
        return mockCards;
    }

    return [
        {
            id: '1',
            question: "What is the primary function of the n8n webhook node?",
            answer: "It serves as a trigger to start a workflow when data is sent to a specific URL via HTTP methods like POST or GET.",
            tag: "Automation",
            color: "blue",
            topic: "n8n",
            category: "Automation",
            subcategory: "Webhooks",
            createdAt: Date.now()
        },
        {
            id: '2',
            question: "How does React handle state updates?",
            answer: "React schedules updates and re-renders components efficiently using a virtual DOM diffing algorithm.",
            tag: "Frontend",
            color: "emerald",
            topic: "React",
            category: "Frontend",
            subcategory: "State Management",
            createdAt: Date.now()
        },
        {
            id: '3',
            question: "Explain the 'indexed' status in the document sidebar.",
            answer: "It indicates that the vector database has successfully processed and stored the document embeddings for retrieval.",
            tag: "System",
            color: "red",
            topic: "RAG",
            category: "System",
            subcategory: "Vector Database",
            createdAt: Date.now()
        }
    ];
};

export const n8nService = {
    async sendMessage(message: string, history: Message[], userId?: string): Promise<Message> {
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

            // Generate or retrieve sessionId for conversation memory (per user)
            const sessionKey = getSessionKey(userId);
            let sessionId = sessionStorage.getItem(sessionKey);
            if (!sessionId) {
                sessionId = `session-${userId || 'anon'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                sessionStorage.setItem(sessionKey, sessionId);
            }

            const response = await fetch(N8N_WEBHOOKS.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    sessionId,
                    userId,
                    history: history.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
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
        try {
            // Check for placeholder URL (demo mode)
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

            // Validate file before converting to Base64
            const maxSize = 25 * 1024 * 1024; // 25MB
            if (file.size > maxSize) {
                throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 25MB`);
            }

            const allowedTypes = ['application/pdf', 'text/plain'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error(`Unsupported file type: ${file.type}. Only PDF and TXT allowed.`);
            }

            // Convert file to Base64
            const base64Content = await fileToBase64(file);

            // Send to n8n with JSON format
            const response = await fetch(N8N_WEBHOOKS.UPLOAD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: base64Content,
                    filename: file.name
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            // Process successful response from n8n workflow
            const data = await response.json();

            return {
                id: Date.now().toString(),
                name: data.filename || file.name,
                type: file.type,
                status: 'indexed',
                size: data.file_size_mb ? `${data.file_size_mb} MB` : `${(file.size / 1024).toFixed(2)} KB`
            };

        } catch (error) {
            console.error('Upload Webhook Error:', error);

            // Improved error handling with specific messages
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            // Show error in console for debugging
            console.error('Detailed error:', errorMessage);

            // Return error status so the UI knows
            return {
                id: Date.now().toString(),
                name: file.name,
                type: file.type,
                status: 'error',
                size: (file.size / 1024).toFixed(2) + ' KB'
            };
        }
    },

    async generateFlashcards(topic?: string, count: number = 10): Promise<Flashcard[]> {
        // Enforce limits
        const validCount = Math.min(15, Math.max(5, count));

        try {
            // Check for placeholder
            if (N8N_WEBHOOKS.FLASHCARDS.includes('your-n8n-instance')) {
                await delay(MOCK_DELAY);
                return getMockFlashcards(topic, validCount);
            }

            const response = await fetch(N8N_WEBHOOKS.FLASHCARDS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: topic ? 'generate_specific' : 'generate_all',
                    topic: topic || '',
                    count: validCount
                })
            });

            if (!response.ok) throw new Error('Flashcard generation failed');

            const data = await response.json();

            // Handle n8n response format: can be an array [{ flashcards: [...] }] or object { flashcards: [...] }
            let flashcardsRaw: any[] = [];
            if (Array.isArray(data) && data.length > 0 && data[0].flashcards) {
                // n8n returns array wrapper: [{ flashcards: [...] }]
                flashcardsRaw = data[0].flashcards;
            } else if (data.flashcards) {
                // Direct object: { flashcards: [...] }
                flashcardsRaw = data.flashcards;
            } else if (Array.isArray(data)) {
                // Direct array of flashcards
                flashcardsRaw = data;
            }

            // Map Spanish field names to English and ensure consistent structure with new fields
            const flashcards: Flashcard[] = flashcardsRaw.map((card: any) => ({
                id: card.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                question: card.question || card.pregunta || '',
                answer: card.answer || card.respuesta || '',
                tag: card.tag || card.etiqueta || 'General',
                color: card.color || 'blue',
                topic: card.topic || topic || 'General',
                category: card.category || card.categoria || 'Sin categoría',
                subcategory: card.subcategory || card.subcategoria || '',
                createdAt: Date.now()
            }));

            return flashcards;

        } catch (error) {
            console.error('Flashcard Webhook Error:', error);
            console.warn('Falling back to mock data due to network error.');

            // Return mock data instead of empty array on network failure
            return getMockFlashcards(topic, validCount);
        }
    }
};