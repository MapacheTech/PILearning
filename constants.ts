// Replace these URLs with your actual n8n webhook production URLs
export const N8N_WEBHOOKS = {
    // POST: Body contains { message: string, history: [] }
    CHAT: 'https://your-n8n-instance.com/webhook/chat',

    // POST: Body contains FormData with 'file'
    UPLOAD: 'https://your-n8n-instance.com/webhook/upload',

    // POST: Body contains { context: string } (optional)
    FLASHCARDS: 'http://192.169.200.9:5678/webhook/generate-flashcards'
};

export const MOCK_DELAY = 1500;