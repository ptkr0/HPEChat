import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppStore } from "@/stores/appStore";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { MembersSidebar } from "@/components/server/members-sidebar";

export default function ServerLayout() {
  const { serverId, channelId } = useParams();
  const { selectServer, selectChannel, channels } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (serverId) selectServer(serverId);
  }, [selectServer, serverId]);

  useEffect(() => {
    if (!serverId) return;

    if (channelId) {
      selectChannel(channelId);
    } else if (channels.length) {
      navigate(`/servers/${serverId}/${channels[0].id}`, { replace: true });
    }
  }, [channelId, channels, navigate, selectChannel, serverId]);
  
  return (
    <div className="flex h-screen w-full">
      <ServerSidebar />

      <main className="flex-1 flex">
        <section className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-xl">Czat w budowie 🙂</p>
        </section>

        <MembersSidebar />
      </main>
    </div>
  );
}
