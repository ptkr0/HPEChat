using System.Collections.Concurrent;

namespace HPEChat.Infrastructure.Services
{
	public class ConnectionMapperService
	{
		private readonly ConcurrentDictionary<Guid, HashSet<string>> _connections = new ConcurrentDictionary<Guid, HashSet<string>>();
		public void Add(Guid userId, string connectionId)
		{
			var set = _connections.GetOrAdd(userId, _ => new HashSet<string>());
			lock (set) { set.Add(connectionId); }
		}

		public IEnumerable<string> GetConnections(Guid userId)
			=> _connections.TryGetValue(userId, out var set) ? set : Enumerable.Empty<string>();

		public void Remove(Guid userId, string connectionId)
		{
			if (_connections.TryGetValue(userId, out var set))
			{
				lock (set)
				{
					set.Remove(connectionId);
					if (set.Count == 0)
						_connections.TryRemove(userId, out _);
				}
			}
		}
	}
}
