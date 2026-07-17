const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini SDK
// Note: It automatically picks up GEMINI_API_KEY from environment variables.
const ai = new GoogleGenAI({});

exports.generateContent = async (req, res) => {
  const { contentType, prompt, image } = req.body;

  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ error: 'Prompt cannot be empty.' });
  }

  if (!contentType) {
    return res.status(400).json({ error: 'Content type must be specified.' });
  }

  try {
    // Construct the prompt for the model
    let systemInstruction = "You are a professional AI content generator.";
    let finalPrompt = `Content Type: ${contentType}\n\nUser Request: ${prompt}\n\nPlease generate the requested content.`;

    switch (contentType) {
      case 'Professional Email':
        systemInstruction = "You are an expert at writing clear, concise, and professional emails.";
        break;
      case 'Blog Introduction':
        systemInstruction = "You are a professional blogger. Write a catchy, engaging introduction for a blog post.";
        break;
      case 'Product Description':
        systemInstruction = "You are an expert copywriter. Write a persuasive, SEO-friendly product description.";
        break;
      case 'Instagram Caption':
        systemInstruction = "You are a social media manager. Write an engaging Instagram caption with relevant hashtags.";
        break;
      case 'LinkedIn Post':
        systemInstruction = "You are a LinkedIn influencer. Write a professional, insightful post suitable for LinkedIn.";
        break;
      case 'Tweet/X Post':
        systemInstruction = "You are a social media expert. Write a punchy, engaging tweet under 280 characters.";
        break;
      default:
        systemInstruction = "You are a highly capable AI assistant specializing in content creation.";
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let contentPayload = finalPrompt;
    if (image && image.data && image.mimeType) {
        contentPayload = [
            finalPrompt,
            { inlineData: { data: image.data, mimeType: image.mimeType } }
        ];
    }

    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-flash-latest',
        contents: contentPayload,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    for await (const chunk of responseStream) {
        if (chunk.text) {
            const data = JSON.stringify({ text: chunk.text });
            res.write(`data: ${data}\n\n`);
        }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Error generating content:', error);
    // If headers are already sent (SSE started), we write an error event instead of a standard response.
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate content.' });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Error generating content during stream.' })}\n\n`);
      res.end();
    }
  }
};
