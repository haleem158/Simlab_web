import { Sidebar } from "../../components/sl/dashboard/Sidebar";
import { Topbar } from "../../components/sl/dashboard/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="slab">
      <div className="dash">
        <Sidebar />
        <div className="main">
          <Topbar />
          {children}
        </div>
      </div>
    </div>
  );
}
