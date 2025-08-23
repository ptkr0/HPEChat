import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppStore } from "@/stores/useAppStore";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { MembersSidebar } from "@/components/server/members-sidebar";
import ChannelLayout from "./ChannelLayout";
import { toast } from "sonner";

export default function ServerLayout() {
  const { serverId, channelId } = useParams();
  const {
    selectServer,
    selectChannel,
    selectedServer,
    serverDetailsLoading,
    serverDetailsError
  } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (serverId && selectedServer?.id !== serverId) {
      // check if the server exists in the store before attempting to select it
      if (useAppStore.getState().servers.some(server => server.id === serverId)) {
          selectServer(serverId);
      } else {
          // if the server doesn't exist, navigate to home
          selectServer(null);
          navigate('/home', { replace: true });
          return;
      }
    }
  }, [selectServer, serverId, selectedServer?.id, navigate]);

  // this useEffect was made to properly handle the case when user deletes channel that is currently selected
  // is deleted channel was also the one that was selected user will be redirected to the first channel in the server
  // if there are no channels user will be redirected to the empty server page
  useEffect(() => {
    if (!serverId || serverDetailsLoading || !selectedServer || selectedServer.id !== serverId) {
      return;
    }

    const serverHasChannels = selectedServer.channels && selectedServer.channels.length > 0;
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
        selectChannel(null);
      }
    }
  }, [serverId, channelId, selectChannel, navigate, serverDetailsLoading, selectedServer]);

  // if serverDetailsError is true, redirect to home page
  useEffect(() => {
    if (serverDetailsError) {
      navigate(`/home`, { replace: true });
      toast.error("Nie udało się załadować serwera. Sprawdź swoje połączenie internetowe lub spróbuj ponownie później.");
    }
  }
    , [serverDetailsError, navigate]);

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
