import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon, Loader2, X } from "lucide-react";
import { Attachment } from "@/types/attachment.types";
import { fileService } from "@/services/fileService";
import { DialogTitle } from "@radix-ui/react-dialog";

interface ImageDetailsModalProps {
  attachment: Attachment;
  previewSrc: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

export function ImageDetailsModal({ 
  attachment, 
  isOpen, 
  onOpenChange, 
  trigger 
}: ImageDetailsModalProps) {
  const [fullImageSrc, setFullImageSrc] = useState<string | null>(null);
  const [isFullImageLoading, setIsFullImageLoading] = useState(false);

  useEffect(() => {
    const loadFullImage = async () => {

      if (isOpen && !fullImageSrc) {
        setIsFullImageLoading(true);
        try {

          if (!attachment.fileName) {
            throw new Error("Attachment file name is not available");
          }
          const blob = await fileService.getServerAttachment(attachment.fileName);
          const url = URL.createObjectURL(blob);
          setFullImageSrc(url);
        } catch (e) {
          console.error("Failed to load full image:", e);
        } finally {
          setIsFullImageLoading(false);
        }

      } else if (!isOpen && fullImageSrc) {
        URL.revokeObjectURL(fullImageSrc);
        setFullImageSrc(null);
      }
    };

    loadFullImage();
  }, [isOpen, fullImageSrc, attachment.fileName]);

  const handleDownload = async () => {
    if (!attachment.fileName) return;
    
    try {
      const blob = await fileService.getServerAttachment(attachment.fileName);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogTitle className="sr-only">
        {attachment.name}
      </DialogTitle>
      <DialogContent className="p-0 flex flex-col [&>button:last-child]:hidden min-w-screen min-h-screen border-none" aria-description={attachment.name}>
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-white">
            <ImageIcon className="w-5 h-5" />
            <div className="flex flex-col">
              <span className="font-medium text-sm">{attachment.name}</span>
              {ImageData && (
                <span className="text-xs text-white/70">
                  {attachment.width} × {attachment.height}
                  {` • ${Math.ceil(attachment.size / 1000)} KB`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
          {isFullImageLoading && <Loader2 className="animate-spin text-white size-16" />}
          {fullImageSrc && !isFullImageLoading && (
            <img
              src={fullImageSrc}
              alt={attachment.name}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              style={{ maxHeight: "calc(100vh - 100px)" }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
