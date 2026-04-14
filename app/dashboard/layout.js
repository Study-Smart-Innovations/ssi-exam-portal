import StudentSidebar from '@/components/StudentSidebar';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Student Dashboard | Study Smart Innovations',
};

export default async function StudentLayout({ children }) {
  const auth = await requireAuth(['student']);
  
  if (auth.error) {
    redirect('/');
  }

  return (
    <div className="dashboard-layout">
      <StudentSidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
