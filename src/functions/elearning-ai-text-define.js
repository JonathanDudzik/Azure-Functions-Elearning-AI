const { app } = require('@azure/functions');

app.http('elearning-ai-text-define', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        
        // Define the external API URL and API key from environment variables
        const apiUrl = 'https://elearning-ai-integration.openai.azure.com/openai/deployments/gpt-35-turbo-elearning/chat/completions?api-version=2023-03-15-preview';
        const apiKey = process.env["API_KEY"];
        
        if (!apiKey) {
            context.log('API key is missing');
            return { status: 500, body: 'Internal server error: API key is not configured' };
        }
        
        // Ensure the request body contains a valid 'message'
        let requestBody;
        try {
            requestBody = await request.json();
        } catch (error) {
            context.log('Error parsing request body:', error);
            return { status: 400, body: 'Invalid request body' };
        }

        if (!requestBody || !requestBody.userContent) {
            return { status: 400, body: 'Request body must include a "userContent" field' };
        }

        if (!requestBody || !requestBody.systemContent) {
            return { status: 400, body: 'Request body must include a "systemContent" field' };
        }

        try {
            // Make the fetch request to the external API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                },
                body: JSON.stringify({
                    "messages": [
                        {
                            "role": "system",
                            "content": requestBody.systemContent
                        },
                        {
                            "role": "user",
                            "content": requestBody.userContent
                        }
                    ],
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "frequency_penalty": 0,
                    "presence_penalty": 0,
                    "max_tokens": 800,
                    "stop": null
                })
            });

            // Handle non-2xx HTTP responses
            if (!response.ok) {
                context.log(`OpenAI API request failed with status ${response.status}`);
                return { status: response.status, body: `OpenAI API error: ${response.statusText}` };
            }

            // Parse the response body from the OpenAI API
            const data = await response.json();

            // Return the result as the function response
            return { body: `${JSON.stringify(data.choices[0].message.content)}` };

        } catch (error) {
            context.log('Error during fetch request:', error);
            return { status: 500, body: `Error fetching data: ${error.message}` };
        }
    }
});
