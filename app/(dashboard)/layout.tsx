import { Sidebar } from "@/features/dashboard/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}
