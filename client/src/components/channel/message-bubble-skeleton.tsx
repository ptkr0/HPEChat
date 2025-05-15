import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface MessageBubbleSkeletonProps {
  isCurrentUser?: boolean
}

export function MessageBubbleSkeleton({ isCurrentUser = false }: MessageBubbleSkeletonProps) {
  return (
      <div className={cn("flex w-full max-w-[80%] gap-3 mb-4", isCurrentUser ? "ml-auto flex-row-reverse" : "")}>
          <Skeleton className="h-10 w-10 rounded-full" />

          <div className="flex flex-col flex-1">
              <div className="flex items-baseline gap-2">
                  <Skeleton className={cn("h-4 w-24", isCurrentUser ? "ml-auto" : "")} />
                  <Skeleton className="h-3 w-20" />
              </div>

              <div className="mt-1 space-y-2">
                  <Skeleton className={cn("h-4 w-full max-w-[250px]", isCurrentUser ? "ml-auto" : "")} />
                  <Skeleton className={cn("h-4 w-full max-w-[200px]", isCurrentUser ? "ml-auto" : "")} />
                  <Skeleton className={cn("h-4 w-full max-w-[150px]", isCurrentUser ? "ml-auto" : "")} />
              </div>
          </div>
      </div>
  )
}