export interface GenerateContentParams {
    prompt: string;
    tone: 'formal' | 'friendly' | 'persuasive' | 'neutral';
    type: 'subject' | 'body';
}

export async function generateEmailContent({ prompt, tone, type }: GenerateContentParams): Promise<string> {
    // Simulator for now - will connect to OpenRouter/DeepSeek later
    console.log(`Generating ${type} with tone ${tone} for prompt: ${prompt}`);

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate latency

    if (type === 'subject') {
        const subjects = [
            "Here's the update you asked for",
            "Checking in on your progress",
            "Exclusive invitation just for you",
            "Big news to share!"
        ];
        return subjects[Math.floor(Math.random() * subjects.length)];
    }

    return `
    <p>Hi {{first_name}},</p>
    <p>I hope this email finds you well. I wanted to reach out regarding <strong>${prompt}</strong>.</p>
    <p>Based on our previous conversation, I believe this is relevant to you because...</p>
    <ul>
      <li>Benefit 1: Something awesome</li>
      <li>Benefit 2: Something else awesome</li>
    </ul>
    <p>Let's chat soon!</p>
    <p>Best regards,<br/>[Your Name]</p>
  `;
}
