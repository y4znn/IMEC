import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Valid query string required.' }, { status: 400 });
        }

        const scriptPath = path.join(process.cwd(), 'scripts', 'rag_query.py');

        return new Promise((resolve) => {
            const pythonProcess = spawn('python3', [scriptPath, query]);

            let outputData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python script error output:', errorData);
                    try {
                        const parsedError = JSON.parse(outputData);
                        return resolve(NextResponse.json({ error: parsedError.error || 'Server error' }, { status: 500 }));
                    } catch {
                        return resolve(NextResponse.json({ error: 'Failed to process intelligence query.' }, { status: 500 }));
                    }
                }

                try {
                    const parsed = JSON.parse(outputData);
                    if (parsed.error) {
                        return resolve(NextResponse.json({ error: parsed.error }, { status: 500 }));
                    }
                    return resolve(NextResponse.json({ answer: parsed.answer }));
                } catch (e) {
                    console.error("Failed to parse JSON from Python script:", outputData);
                    return resolve(NextResponse.json({ error: 'Invalid response from intelligence engine.' }, { status: 500 }));
                }
            });
        });
    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
