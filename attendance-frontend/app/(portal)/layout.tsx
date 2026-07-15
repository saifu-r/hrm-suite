import PortalGuard from "../components/PortalGuard";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard>
      <div className="min-h-screen bg-gray-50 pb-20">
        {children}
      </div>
    </PortalGuard>
  );
}