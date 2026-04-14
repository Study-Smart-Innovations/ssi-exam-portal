import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const auth = await requireAuth(['admin']);
    if (auth.error) return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });

    const payload = await req.json();
    const studentsArr = payload.students || [];
    const batch = payload.batch || [];

    if (studentsArr.length === 0 || !Array.isArray(batch) || batch.length === 0) {
       return new Response(JSON.stringify({ error: 'Missing required fields or empty students array' }), { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ssi_portal');

    const defaultPassword = process.env.STUDENT_DEFAULT_PASSWORD || 'student123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const attempts = {};
    batch.forEach(b => attempts[b] = 3);

    // Filter out existing emails efficiently
    const emailsToImport = studentsArr.map(s => s.email).filter(Boolean);
    const existingDocs = await db.collection('students').find({ email: { $in: emailsToImport } }).toArray();
    const existingEmails = new Set(existingDocs.map(d => d.email));

    const newDocuments = [];
    let insertedCount = 0;

    for (const s of studentsArr) {
      if (!s.name || !s.email || !s.phone) continue;

      if (!existingEmails.has(s.email)) {
         newDocuments.push({
           name: s.name,
           email: s.email,
           phone: s.phone,
           batch,
           password: hashedPassword,
           attempts,
           createdAt: new Date()
         });
         // Add to set to prevent duplicates within the imported file itself
         existingEmails.add(s.email);
      }
    }

    if (newDocuments.length > 0) {
       const result = await db.collection('students').insertMany(newDocuments, { ordered: false });
       insertedCount = result.insertedCount;
    }

    if (insertedCount === 0 && studentsArr.length > 0) {
       return new Response(JSON.stringify({ error: 'Data conflict: All provided emails already exist in the database or invalid rows.' }), { status: 409 });
    }

    return new Response(JSON.stringify({ success: true, insertedCount }), { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
