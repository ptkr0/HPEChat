import React, { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateServerModal = ({ isOpen, onClose }: CreateServerModalProps) => {
    const [serverName, setServerName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createServerAction = useAppStore((state) => state.createServer);
    const selectServerAction = useAppStore((state) => state.selectServer);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        setIsLoading(true);

        const newServerData = { name: serverName, description: description || undefined };

        try {
            const newServer = await createServerAction(newServerData);
            if (newServer) {
                console.log("Server created successfully:", newServer);
                onClose();
                setServerName('');
                setDescription('');
                
                selectServerAction(newServer.id);
            }
        } catch (apiError) {
            console.error("API Error creating server:", apiError);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Utwórz nowy serwer</DialogTitle>
                    <DialogDescription>
                        Jeden formularz dzieli cię od utworzenia nowego serwera.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nazwa
                            </Label>
                            <Input
                                id="name"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                className="col-span-3"
                                disabled={isLoading}
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Opis
                            </Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="col-span-3"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isLoading}>
                                Anuluj
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading || !serverName.trim()}>
                            {isLoading ? 'Tworzenie...' : 'Utwórz'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};