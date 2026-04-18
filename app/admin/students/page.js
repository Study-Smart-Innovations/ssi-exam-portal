'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, Trash2 } from 'lucide-react';
import { useModal } from '@/lib/contexts/ModalContext';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showAlert, showConfirm } = useModal();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'Remove Student', 
      'Are you sure you want to remove this student? All their exam history, attempts, and associated data will be permanently deleted. This action cannot be reversed.', 
      'DANGER'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');
      setStudents(students.filter(s => s._id !== id));
      showAlert('Success', 'Student has been removed successfully.', 'SUCCESS');
    } catch (err) {
      showAlert('Error', err.message, 'DANGER');
    }
  };

  if (loading) return <div className="container p-8 text-center">Loading students...</div>;

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-gradient">Student Management</h1>
          <p style={{ color: 'var(--border)' }}>Manage enrolled students and their exam attempts.</p>
        </div>
        <Link href="/admin/students/new" className="btn btn-primary">
          <UserPlus size={18} />
          Add Student
        </Link>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Enrolled Batches</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
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
                <tr key={student._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{student.phone}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{student.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <div className="flex gap-2 flex-wrap">
                       {student.batch?.map(b => (
                         <span key={b} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>{b}</span>
                       ))}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={() => handleDelete(student._id)}
                        className="btn btn-danger" 
                        style={{ padding: '0.4rem 0.8rem', minWidth: '120px', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        <Trash2 size={14} />
                        <span>Remove Student</span>
                      </button>
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
