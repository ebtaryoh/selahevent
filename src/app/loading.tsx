import { ChristianLoadingScreen } from "@/components/christian-loading-screen";

export default function Loading() {
  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <ChristianLoadingScreen message="Preparing the Sanctuary..." />
    </div>
  );
}
