import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductCardSkeletonProps {
  /** Variant for different card layouts */
  variant?: "grid" | "list" | "compact";
  /** Number of skeleton cards to render */
  count?: number;
  /** Show image placeholder */
  showImage?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Show badges */
  showBadges?: boolean;
}

/**
 * Reusable skeleton component for product cards
 * Can be used across Produtos, Estoque, VitrineVirtual pages
 */
export function ProductCardSkeleton({ 
  variant = "grid", 
  count = 1,
  showImage = true,
  showActions = true,
  showBadges = true
}: ProductCardSkeletonProps) {
  const renderGridCard = (index: number) => (
    <Card key={index} className="overflow-hidden">
      <CardHeader className="p-0">
        {showImage && <Skeleton className="h-48 w-full rounded-b-none" />}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {showBadges && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        )}
        <Skeleton className="h-6 w-full" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderListCard = (index: number) => (
    <Card key={index} className="overflow-hidden">
      <CardContent className="p-4 flex gap-4 items-center">
        {showImage && <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            {showBadges && (
              <div className="flex gap-1">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            )}
          </div>
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCompactCard = (index: number) => (
    <Card key={index} className="overflow-hidden">
      <CardContent className="p-3 flex gap-3 items-center">
        {showImage && <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-20" />
      </CardContent>
    </Card>
  );

  const renderCard = (index: number) => {
    switch (variant) {
      case "list":
        return renderListCard(index);
      case "compact":
        return renderCompactCard(index);
      default:
        return renderGridCard(index);
    }
  };

  if (count === 1) {
    return renderCard(0);
  }

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => renderCard(i))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => renderCard(i))}
    </div>
  );
}
