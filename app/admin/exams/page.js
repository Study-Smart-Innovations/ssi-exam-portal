import clientPromise from '@/lib/mongodb';
import Link from 'next/link';

export default async function ExamsPage() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || 'ssi_portal');
  
  const exams = await db.collection('exams').find({}).sort({ _id: -1 }).toArray();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-gradient">Exam Management</h1>
          <p style={{ color: 'var(--border)' }}>Create and configure exams for various batches.</p>
        </div>
        <Link href="/admin/exams/new" className="btn btn-primary">
          + Create Exam
        </Link>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Title</th>
              <th style={{ padding: '1rem' }}>Batch</th>
              <th style={{ padding: '1rem' }}>Duration</th>
              <th style={{ padding: '1rem' }}>Questions (MCQ/Coding)</th>
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--border)' }}>
                  No exams configured yet. Click 'Create Exam' to begin.
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam._id.toString()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{exam.title}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                      {exam.batch}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{exam.duration} mins</td>
                  <td style={{ padding: '1rem' }}>
                    {exam.mcqs?.length || 0} / {exam.codingQuestions?.length || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
