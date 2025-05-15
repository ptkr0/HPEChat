import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppStore } from "@/stores/appStore";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { MembersSidebar } from "@/components/server/members-sidebar";
import ChannelLayout from "./ChannelLayout";

export default function ServerLayout() {
  const { serverId, channelId } = useParams();
  const { 
    selectServer, 
    selectChannel, 
    selectedServer,
    serverDetailsLoading
  } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (serverId) {
      selectServer(serverId);
    }
  }, [selectServer, serverId]);

  useEffect(() => {
    if (!serverId || serverDetailsLoading) {
      return;
    }

    const serverHasChannels = selectedServer && selectedServer.channels.length > 0;
    const currentChannelIsValid = channelId && serverHasChannels && selectedServer.channels.some(ch => ch.id === channelId);

    if (channelId) {
      if (currentChannelIsValid) {
        selectChannel(channelId);
      } else {
        if (serverHasChannels) {
          navigate(`/servers/${serverId}/${selectedServer.channels[0].id}`, { replace: true });
        } else {
          navigate(`/servers/${serverId}`, { replace: true });
          selectChannel(null);
        }
      }
    } else {
      if (serverHasChannels) {
        navigate(`/servers/${serverId}/${selectedServer.channels[0].id}`, { replace: true });
      } else {
        navigate(`/servers/${serverId}`, { replace: true });
        selectChannel(null);
      }
    }
  }, [serverId, channelId, selectChannel, navigate, serverDetailsLoading, selectedServer]);
  
  return (
    <div className="flex h-screen w-full">
      <ServerSidebar />
      
      <section className="w-full flex overflow-hidden">
        {channelId ? (
          <ChannelLayout />
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground">Wybierz kanał 😅</p>
          </div>
        )}
      </section>
      
      <MembersSidebar />
    </div>
  );
}
