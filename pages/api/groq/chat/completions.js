import { Groq } from "groq-sdk";

export default async function handler(req, res) {
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Raw body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('API route hit, checking API key:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log('Request body:', req.body);
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        message: 'Invalid messages format',
        received: messages,
        bodyType: typeof req.body,
        body: req.body
      });
    }

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "mixtral-8x7b-32768",
    });

    return res.status(200).json(completion);
  } catch (error) {
    console.error('Detailed Groq API error:', {
      message: error.message,
      stack: error.stack,
      details: error
    });
    return res.status(500).json({ 
      message: 'Error calling Groq API',
      error: error.message,
      stack: error.stack
    });
  }
} 