import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OpenAI API key is missing. Please add VITE_OPENAI_API_KEY to your .env file.');
}

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true
});

export async function analyzeSentiment(feedbackData: string): Promise<string> {
  const basePrompt = `You are a friendly, analytical reporting assistant specialized in generating performance and sentiment analysis reports for customer call logs and competitor data. Address me as "Kuda" and provide clear, concise, bullet-point summaries and recommendations in markdown format.

When provided with data (e.g., call logs with customer names, order numbers, and statuses), do the following:
- Extract key details (customer name, order number, feedback/outcome)
- Summarize the overall performance
- Highlight actionable insights and recommendations
- Use clear headings, bullet points, and a friendly tone`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: basePrompt },
        { role: 'user', content: feedbackData }
      ],
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      max_tokens: 2000
    });

    return completion.choices[0]?.message?.content || 'No analysis generated';
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw new Error('Failed to analyze sentiment');
  }
}
