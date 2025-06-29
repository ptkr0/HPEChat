import { useState, useRef, useEffect } from "react";
import { Attachment } from "@/types/attachment.types";
import { useAppStore } from "@/stores/appStore";
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

	return (
		<div
			ref={ref}
			className="bg-muted overflow-hidden rounded-lg flex items-center justify-center w-fit h-fit"
			style={{
				maxWidth: Math.min(attachment.width || 550, 550),
				maxHeight: Math.min(attachment.height || 300, 300),
			}}
		>
			{!previewSrc ? (
				<Skeleton
					className="w-full h-full"
					style={{
						width: Math.min(attachment.width || 550, 550),
						height: Math.min(attachment.height || 300, 300),
					}}
				/>
			) : (
				<ImageDetailsModal
					attachment={attachment}
					previewSrc={previewSrc}
					isOpen={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					trigger={
						<img
							src={previewSrc}
							alt={attachment.name}
							className="max-w-full max-h-full w-auto h-auto object-contain cursor-pointer transition-transform hover:scale-105"
							style={{
								maxWidth: Math.min(attachment.width || 550, 550),
								maxHeight: Math.min(attachment.height || 300, 300),
							}}
						/>
					}
				/>
			)}
		</div>
	);
}