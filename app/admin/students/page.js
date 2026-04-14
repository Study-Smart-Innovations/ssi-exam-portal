import clientPromise from '@/lib/mongodb';
import Link from 'next/link';

export default async function StudentsPage() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || 'ssi_portal');
  
  const students = await db.collection('students').find({}).sort({ _id: -1 }).toArray();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-gradient">Student Management</h1>
          <p style={{ color: 'var(--border)' }}>Manage enrolled students and their batches.</p>
        </div>
        <Link href="/admin/students/new" className="btn btn-primary">
          + Add Student
        </Link>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Phone</th>
              <th style={{ padding: '1rem' }}>Batches</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--border)' }}>
                  No students found. Add a student to get started.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student._id.toString()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>{student.name}</td>
                  <td style={{ padding: '1rem' }}>{student.email}</td>
                  <td style={{ padding: '1rem' }}>{student.phone}</td>
                  <td style={{ padding: '1rem' }}>
                    <div className="flex gap-2">
                       {student.batch?.map(b => (
                         <span key={b} style={{ background: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>{b}</span>
                       ))}
                    </div>
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
