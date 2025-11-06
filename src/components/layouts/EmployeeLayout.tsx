import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { EmployeeSidebar } from '@/components/employee/EmployeeSidebar';
import Navbar from '@/components/common/Navbar';
import { PendingSyncBadge } from '@/components/common/PendingSyncBadge';

const EmployeeLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <EmployeeSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <PendingSyncBadge />
              </div>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EmployeeLayout;
