import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ServerIcon, Users, Hash, Crown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAppStore } from "@/stores/useAppStore"
import type { ServerDetails } from "@/types/server.types"

interface ServerInfoModalProps {
  isOpen: boolean
  onClose: () => void
  server: ServerDetails
}

export function ServerInfoModal({ isOpen, onClose, server }: ServerInfoModalProps) {
  const serverImageBlobs = useAppStore((state) => state.serverImageBlobs)
  const avatarBlobs = useAppStore((state) => state.avatarBlobs)
  const serverImage = serverImageBlobs.get(server.id)

  const owner = server.members.find((member) => member.id === server.ownerId)

  // limit displayed members to prevent overwhelming UI
  const displayedMembers = server.members.slice(0, 12)
  const hasMoreMembers = server.members.length > 12

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
              {serverImage ? (
                <Avatar className="h-full w-full rounded-2xl">
                  <AvatarImage
                    src={serverImage || "/placeholder.svg"}
                    alt={`${server.name} icon`}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold rounded-2xl">
                    {server.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-full w-full rounded-2xl flex items-center justify-center">
                  <ServerIcon className="h-10 w-10 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold truncate">{server.name}</DialogTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {server.members.length} {server.members.length === 1 ? "członek" : "członków"}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 mr-4">

            {server.description && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  O Serwerze
                </h4>
                <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-lg">{server.description}</p>
              </div>
            )}

            {owner && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                  Właściciel Serwera
                </h4>
                <div className="flex items-center space-x-3 bg-muted/30 p-3 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarBlobs.get(owner.id)} alt={owner.username} />
                    <AvatarFallback>
                      {owner.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{owner.username}</p>
                  </div>
                </div>
              </div>
            )}

            {server.channels.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center">
                  <Hash className="h-4 w-4 mr-2" />
                  Kanały ({server.channels.length})
                </h4>
                <div className="space-y-2">
                  {server.channels.length > 0 && (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {server.channels.slice(0, 8).map((channel) => (
                          <div key={channel.id} className="flex items-center space-x-2 text-sm bg-muted/30 p-2 rounded">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{channel.name}</span>
                          </div>
                        ))}
                      </div>
                      {server.channels.length > 8 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{server.channels.length - 8} więcej kanałów
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Członkowie ({server.members.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarBlobs.get(member.id)} alt={member.username} />
                      <AvatarFallback className="text-xs">
                        {member.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {member.username}
                        {member.id === server.ownerId && <Crown className="h-3 w-3 inline ml-1 text-yellow-500" />}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {hasMoreMembers && (
                <div className="mt-3 text-center">
                  <Badge variant="secondary" className="text-xs">
                    +{server.members.length - 12} więcej członków
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
