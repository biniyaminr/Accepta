import Layout from "@/components/layout/Layout";

// Standard user shell: the feature-rich "Mission Control" sidebar (AI Studio,
// Applications, Calendar, …) plus the app header. Scoped to the (user) route
// group so it can NEVER leak into the admin section.
export default function UserGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
