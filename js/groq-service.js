export class GroqService {
    constructor() {
        this.baseUrl = '/api/groq/chat/completions';
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkConnection() {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [{ role: "user", content: "test" }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
            }

            this.isConnected = true;
            this.retryCount = 0;
            return true;
        } catch (error) {
            this.isConnected = false;
            throw error;
        }
    }

    async generateCompletion(prompt, currentCode = null) {
        try {
            if (!this.isConnected) {
                await this.checkConnection();
            }

            const messages = [
                {
                    role: "system",
                    content: "You are a helpful coding assistant. When suggesting code changes, always format them in markdown."
                    // maybe change the prompt to only give markdown instead of diffs (as changed in the prompt above), and then write code that would display an option for the user to first preview the suggested code changes in diff format, and then give the user an option to either accept or reject the code changes suggested by the model,
                }
            ];

            if (currentCode) {
                messages.push({
                    role: "user",
                    content: `Here's the current code:\n\`\`\`\n${currentCode}\n\`\`\``
                });
            }

            messages.push({
                role: "user",
                content: prompt
            });

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Error calling Groq API:', error);
            throw error;
        }
    }

    async listModels() {
        return [
            { name: 'mixtral-8x7b-32768' },
            { name: 'llama2-70b-4096' },
            { name: 'gemma-7b-it' }
        ];
    }
}

export default new GroqService(); 
