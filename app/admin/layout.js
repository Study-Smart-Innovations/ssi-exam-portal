import AdminSidebar from '@/components/AdminSidebar';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Dashboard | Study Smart Innovations',
};

export default async function AdminLayout({ children }) {
  const auth = await requireAuth(['admin']);
  
  if (auth.error) {
    redirect('/');
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
