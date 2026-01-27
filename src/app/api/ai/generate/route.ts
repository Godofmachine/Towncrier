import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt, tone, type, fromName, previousContent, instruction, availableVariables } = await req.json();
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("Missing GROQ_API_KEY in server environment");
            return NextResponse.json({
                error: 'Server configuration error: AI service not available',
                needsSetup: true
            }, { status: 503 });
        }

        // Smart model selection based on tone
        const modelMap = {
            'persuasive': 'llama-3.3-70b-versatile',    // 70B for creative, sales-focused emails (1K/day)
            'friendly': 'llama-3.1-8b-instant',         // 8B for casual emails (14.4K/day)
            'formal': 'llama-3.1-8b-instant',           // 8B for corporate emails (14.4K/day)
            'neutral': 'llama-3.1-8b-instant'           // 8B for standard professional (14.4K/day)
        };

        const selectedModel = modelMap[tone as keyof typeof modelMap] || 'llama-3.1-8b-instant';

        let systemPrompt = "";

        // MODE 1: REFINEMENT (Follow-up)
        if (instruction && previousContent) {
            systemPrompt = `You are an expert editor.
            Task: Rewrite the following email content based on the user's instruction.
            Tone: ${tone}
            
            Original Content:
            """
            ${previousContent}
            """
            
            User Instruction: "${instruction}"
            
            Guidelines:
            - Maintain the HTML formatting of the original unless asked to change it.
            - Keep the original variables {{first_name}}, etc. intact.
            - Respond with ONLY the rewritten content (HTML). No explanations.`;
        }
        // MODE 2: GENERATION (New)
        else {
            systemPrompt = type === 'subject'
                ? `You are an expert email subject line writer.
                   Tone: ${tone}
                   Task: Write a compelling email subject line.
                   
                   Guidelines:
                   - Keep it under 60 characters
                   - Make it catchy and attention-grabbing
                   - Use personalization when appropriate (e.g., "{{first_name}}")
                   - No HTML formatting
                   - Don't use quotes around the subject
                   - IMPORTANT: Respond with ONLY the subject line text. Do not provide any explanation, labels like 'Here is the subject:', or any other conversational text. Just the subject line itself.
                   
                   Context: ${prompt}`
                : `You are an expert email copywriter specializing in personalized campaigns.
                   Tone: ${tone}
                   From: ${fromName || "The Sender"}
                   Task: Write the body content for an email.
                   
                   IMPORTANT GUIDELINES:
                   1. Use HTML tags ONLY: <p>, <ul>, <li>, <strong>, <em>, <br>
                   2. Use personalization variables ONLY for these available fields: {{first_name}}, {{last_name}}, {{email}}${availableVariables?.length ? `, ${availableVariables.map((v: any) => `{{${v}}}`).join(', ')}` : ''}
                   3. For ANY other specific details (dates, locations, products) NOT in the available variables list, use a placeholder like [Insert Date]. Do NOT invent variable names like {{event_date}} unless they are explicitly listed as available.
                   4. Do NOT output markdown, code blocks, or any non-HTML formatting
                   5. Do NOT include a subject line in the body
                   6. Start directly with a greeting like: <p>Hi {{first_name}},</p>
                   7. Keep paragraphs concise and scannable
                   8. End with a clear call-to-action when appropriate
                   9. Sign off using the provided 'From Name': ${fromName || "[Your Name]"}
                   
                   Tone Style Guide:
                   ${tone === 'persuasive' ? '- Use compelling language and emotional triggers\\n- Include strong CTAs\\n- Focus on benefits and urgency' : ''}
                   ${tone === 'friendly' ? '- Use conversational, warm language\\n- Be approachable and genuine\\n- Use contractions and casual phrasing' : ''}
                   ${tone === 'formal' ? '- Use professional, polished language\\n- Be respectful and corporate\\n- Avoid contractions and slang' : ''}
                   ${tone === 'neutral' ? '- Use clear, professional language\\n- Be direct and informative\\n- Balance friendliness with professionalism' : ''}
                   
                   Context: ${prompt}`;
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": selectedModel,
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": "Generate the content now." }
                ],
                "temperature": tone === 'persuasive' ? 0.9 : 0.7, // Higher creativity for persuasive
                "max_tokens": type === 'subject' ? 100 : 1024
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Groq API Error (${selectedModel}):`, errorText);

            // Fallback to 8B model if 70B is rate-limited
            if (response.status === 429 && selectedModel === 'llama-3.3-70b-versatile') {
                console.log("Rate limited on 70B, trying fallback to 8B model...");
                return fallbackTo8BModel(apiKey, systemPrompt, tone, type);
            }

            throw new Error(`AI Request Failed: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || "";

        // Aggressive cleanup to ensure only HTML output
        content = content
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .replace(/^\s*["'`]/g, '')  // Remove leading quotes
            .replace(/["'`]\s*$/g, '')  // Remove trailing quotes
            .trim();

        return NextResponse.json({
            content,
            model: selectedModel // Return which model was used (helpful for debugging)
        });
    } catch (error: any) {
        console.error("AI Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Fallback function for rate limiting
async function fallbackTo8BModel(apiKey: string, systemPrompt: string, tone: string, type: string) {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "llama-3.1-8b-instant",
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": "Generate the content now." }
                ],
                "temperature": 0.7,
                "max_tokens": type === 'subject' ? 100 : 1024
            })
        });

        if (!response.ok) {
            throw new Error("Fallback model also failed");
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || "";
        content = content.replace(/```html/g, '').replace(/```/g, '').trim();

        return NextResponse.json({
            content,
            model: "llama-3.1-8b-instant (fallback)"
        });
    } catch (error: any) {
        throw new Error(`Both primary and fallback models failed: ${error.message}`);
    }
}
