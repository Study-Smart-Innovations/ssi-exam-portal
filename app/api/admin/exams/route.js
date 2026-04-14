import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const auth = await requireAuth(['admin']);
    if (auth.error) return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });

    const payload = await req.json();

    if (!payload.title || !payload.batch || !payload.duration) {
       return new Response(JSON.stringify({ error: 'Missing basic exam configuration' }), { status: 400 });
    }

    const newExam = {
      title: payload.title,
      batch: payload.batch,
      duration: payload.duration,
      rules: payload.rules || [],
      mcqs: payload.mcqs || [],
      codingQuestions: payload.codingQuestions || [],
      createdAt: new Date()
    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ssi_portal');
    
    const result = await db.collection('exams').insertOne(newExam);

    return new Response(JSON.stringify({ success: true, id: result.insertedId }), { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
