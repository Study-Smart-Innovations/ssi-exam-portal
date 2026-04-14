import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    const auth = await requireAuth(['student']);
    if (auth.error) return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });

    const { examId, snap } = await req.json();

    if (!examId || !snap) return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ssi_portal');

    const exam = await db.collection('exams').findOne({ _id: new ObjectId(examId) });
    if (!exam) return new Response(JSON.stringify({ error: 'Exam not found' }), { status: 404 });

    const student = await db.collection('students').findOne({ _id: new ObjectId(auth.user.id) });
    
    // Check attempts
    const attemptsLeft = student.attempts?.[exam.batch] ?? 0;
    if (attemptsLeft <= 0) {
       return new Response(JSON.stringify({ error: 'No attempts left for this batch.' }), { status: 403 });
    }

    // Decrement attempts
    const updatePath = `attempts.${exam.batch}`;
    await db.collection('students').updateOne(
      { _id: new ObjectId(auth.user.id) },
      { $inc: { [updatePath]: -1 } }
    );

    // Create session (submission doc)
    const newSubmission = {
      studentId: new ObjectId(auth.user.id),
      examId: new ObjectId(examId),
      examTitle: exam.title,
      batch: exam.batch,
      proctorSnap: snap,
      startedAt: new Date(),
      status: 'started',
      mcqAnswers: {},
      codingAnswers: {}
    };

    const result = await db.collection('submissions').insertOne(newSubmission);

    return new Response(JSON.stringify({ success: true, submissionId: result.insertedId }), { status: 201 });
  } catch (error) {
    console.error('Begin Exam Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
