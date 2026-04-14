import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import Link from 'next/link';

export default async function StudentDashboardOverview() {
  const auth = await requireAuth(['student']);
  if (auth.error) return null; // Handled by layout redirect

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || 'ssi_portal');

  // Fetch full student info to get their batches and attempts
  const student = await db.collection('students').findOne({ _id: new ObjectId(auth.user.id) });

  if (!student || !student.batch) {
     return <div>No courses enrolled. Contact Administrator.</div>;
  }

  // Find exams that match student batches
  const availableExams = await db.collection('exams').find({
    batch: { $in: student.batch }
  }).toArray();

  return (
    <div>
      <h1 className="text-gradient">Welcome, {student.name}</h1>
      <p style={{ color: 'var(--border)', marginBottom: '2rem' }}>Ready to take your exams and get certified?</p>
      
      <h2 className="mb-4">Available Exams</h2>
      
      {availableExams.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--border)' }}>
          No exams currently assigned to your enrolled courses.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {availableExams.map(exam => {
            const attemptsLeft = student.attempts?.[exam.batch] ?? 0;
            const hasAttempts = attemptsLeft > 0;

            return (
              <div key={exam._id.toString()} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <h3 className="mb-2">{exam.title}</h3>
                <div className="flex gap-2 mb-4">
                   <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{exam.batch}</span>
                   <span style={{ fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{exam.duration} mins</span>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--border)', marginBottom: '1.5rem', flex: 1 }}>
                  Attempts Remaining: <strong style={{ color: hasAttempts ? 'var(--success)' : 'var(--danger)' }}>{attemptsLeft}</strong>
                </p>

                {hasAttempts ? (
                  <Link href={`/exam/start/${exam._id}`} className="btn btn-primary" style={{ width: '100%' }}>
                    Go to Exam Area
                  </Link>
                ) : (
                  <button className="btn btn-secondary" disabled style={{ width: '100%', opacity: 0.5 }}>
                    Maximum Attempts Reached
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
