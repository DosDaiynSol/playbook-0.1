import { ActionLog } from '../types';

const API_ENDPOINT = 'https://n8n.daiynsolutions.com/webhook/7346f258-dc5f-427a-b3cc-c77a26a49ac2';

export const ChatService = {
    sendMessage: async (message: string): Promise<ActionLog[]> => {
        try {
            const now = new Date();
            const hours = now.getHours();
            let timeOfDay = 'Night';
            if (hours >= 5 && hours < 12) timeOfDay = 'Morning';
            else if (hours >= 12 && hours < 17) timeOfDay = 'Afternoon';
            else if (hours >= 17 && hours < 21) timeOfDay = 'Evening';

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    local_context: {
                        timestamp: now.toISOString(),
                        timeOfDay,
                        timezoneOffset: now.getTimezoneOffset()
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            // Expected response structure: Array of ActionLogs
            // If the API returns a different shape, detailed mapping will be needed here.
            // Assuming for now it strictly adheres to the ActionLog interface or we cast it.

            // Basic validation/fallback
            if (Array.isArray(data)) {
                return data as ActionLog[];
            } else if (typeof data === 'object') {
                // If single object, wrap in array
                return [data] as ActionLog[];
            }

            return [];
        } catch (error) {
            console.error('ChatService Error:', error);
            // Return a system error message as a log item
            return [
                {
                    id: Date.now().toString() + Math.random().toString(36).substring(7),
                    type: 'SYSTEM_MESSAGE',
                    content: 'Failed to connect to Neural Link. Please try again.',
                    timestamp: Date.now(),
                },
            ];
        }
    },
};
