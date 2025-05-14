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
    channels, 
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

    const serverHasChannels = channels && channels.length > 0;
    const currentChannelIsValid = channelId && serverHasChannels && channels.some(ch => ch.id === channelId);

    if (channelId) {
      if (currentChannelIsValid) {
        selectChannel(channelId);
      } else {
        if (serverHasChannels) {
          navigate(`/servers/${serverId}/${channels[0].id}`, { replace: true });
        } else {
          navigate(`/servers/${serverId}`, { replace: true });
          selectChannel(null);
        }
      }
    } else {
      if (serverHasChannels) {
        navigate(`/servers/${serverId}/${channels[0].id}`, { replace: true });
      } else {
        navigate(`/servers/${serverId}`, { replace: true });
        selectChannel(null);
      }
    }
  }, [serverId, channelId, channels, selectChannel, navigate, serverDetailsLoading]);
  
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
