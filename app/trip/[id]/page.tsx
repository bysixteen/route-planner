import TripPageClient from "./trip-page-client";

export function generateStaticParams() {
  return [{ id: "5343bc4d-ef69-4f03-be45-4519696bf722" }];
}

export default function TripPage() {
  return <TripPageClient />;
}
