import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import StudentSidebar from '@/components/StudentSidebar';

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
      <MobileHeader sidebar={StudentSidebar} />
      <main className="main-content mobile-padded">
        {children}
      </main>
    </div>
  );
}
