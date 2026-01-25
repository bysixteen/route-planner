export const metadata = {
  title: 'Route Planner Studio',
  description: 'Manage your road trips',
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
