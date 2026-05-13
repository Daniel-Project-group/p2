import 'dotenv/config';

async function testGroq() {
    console.log('Testing Groq connection...');
    console.log('API key found:', process.env.GROQ_API_KEY ? 'Yes ✓' : 'No ✗');

    if (!process.env.GROQ_API_KEY) {
        console.log('ERROR: No API key found in .env file');
        return;
    }

    const startTime = Date.now();

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: 'Say hello in one short sentence.' }]
            })
        });

        const data = await response.json();
        const duration = Date.now() - startTime;

        if (response.ok) {
            console.log(`\n✓ Success! Took ${duration}ms`);
            console.log('AI said:', data.choices[0].message.content);
        } else {
            console.log('\n✗ Error response:', data);
        }
    } catch (error) {
        console.log('\n✗ Connection failed:', error.message);
    }
}

testGroq();