import { useState, useRef, useEffect } from "react";
import { Attachment } from "@/types/attachment.types";
import { useAppStore } from "@/stores/useAppStore";
import { useOnScreen } from "@/hooks/useOnScreen";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageDetailsModal } from "../modals/image-details-modal";

interface ImageAttachmentProps {
	attachment: Attachment;
}

export function ImageAttachment({ attachment }: ImageAttachmentProps) {
	const ref = useRef<HTMLDivElement>(null);
	const isVisible = useOnScreen(ref as React.RefObject<HTMLElement>, { rootMargin: "200px" });
	const fetchAndCacheAttachmentPreview = useAppStore((state) => state.fetchAndCacheAttachmentPreview);
	const previewSrc = useAppStore((state) => state.attachmentPreviews.get(attachment.id));

	const [isLoading, setIsLoading] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	// fetch preview when the component is visible for the first time
	useEffect(() => {
		if (isVisible && !previewSrc && !isLoading && attachment.previewName) {
			setIsLoading(true);
			fetchAndCacheAttachmentPreview(attachment.id, attachment.previewName)
				.catch(() => console.error("Failed to fetch attachment preview"))
				.finally(() => setIsLoading(false));
		}
	}, [isVisible, previewSrc, isLoading, attachment, fetchAndCacheAttachmentPreview]);

	// calculate aspect ratio for container
	const aspectRatio = attachment.width && attachment.height 
		? attachment.height / attachment.width 
		: 9 / 16;
		
	// calculate width and height with maximum constraint
	const width = Math.min(attachment.width || 250, 300);
	const height = attachment.width && attachment.height
		? width * aspectRatio
		: Math.min(attachment.height || 150, 200);

	const [imageLoaded, setImageLoaded] = useState(false);

	return (
		<div
			ref={ref}
			className="overflow-hidden rounded-lg"
			style={{
				width: `${width}px`,
				height: `${height}px`,
				position: 'relative'
			}}
		>
			{/* skeleton shows until image is loaded */}
			{(!previewSrc || !imageLoaded) && (
				<Skeleton
					className="absolute inset-0 z-0"
					style={{
						width: '100%',
						height: '100%',
					}}
				/>
			)}
			
			{previewSrc && (
				<ImageDetailsModal
					attachment={attachment}
					previewSrc={previewSrc}
					isOpen={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					trigger={
						<div className="absolute inset-0 flex items-center justify-center">
							<img
								src={previewSrc}
								alt={attachment.name}
								className={`max-w-full max-h-full w-auto h-auto object-contain cursor-pointer ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
								style={{
									maxWidth: '100%',
									maxHeight: '100%',
								}}
								onLoad={() => setImageLoaded(true)}
							/>
						</div>
					}
				/>
			)}
		</div>
	);
}