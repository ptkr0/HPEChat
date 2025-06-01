import { Skeleton } from "@/components/ui/skeleton"

export function MessageBubbleSkeleton() {
  return (
    <div className="flex w-full gap-3 mb-4 px-4 py-1.5">
      <Skeleton className="h-10 w-10 rounded-full mt-0.5" />

      <div className="flex flex-col max-w-full w-full overflow-hidden">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>

        <div className="mt-2">
          <Skeleton className="h-4 w-full max-w-[600px] mb-1" />
          <Skeleton className="h-4 w-full max-w-[460px] mb-1" />
          <Skeleton className="h-4 w-full max-w-[280px]" />
        </div>
      </div>
    </div>
  )
}