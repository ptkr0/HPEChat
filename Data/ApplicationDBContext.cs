using HPEChat_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace HPEChat_Server.Data
{
	public class ApplicationDBContext(DbContextOptions<ApplicationDBContext> options) : DbContext(options)
	{
		public DbSet<User> Users { get; set; }
		public DbSet<Server> Servers { get; set; }
		public DbSet<PrivateMessage> PrivateMessages { get; set; }
		public DbSet<ServerMessage> ServerMessages { get; set; }
		public DbSet<Channel> Channels { get; set; }

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			// when user is deleted, set the senderId for all messages sent by them to null
			modelBuilder.Entity<PrivateMessage>()
				.HasOne(m => m.Sender)
				.WithMany(u => u.SentMessages)
				.HasForeignKey(m => m.SenderId)
				.OnDelete(DeleteBehavior.SetNull);

			// when user is deleted, set the receiverId for all messages sent to them to null
			modelBuilder.Entity<PrivateMessage>()
				.HasOne(m => m.Receiver)
				.WithMany(u => u.ReceivedMessages)
				.HasForeignKey(m => m.ReceiverId)
				.OnDelete(DeleteBehavior.SetNull);

			// when a user is deleted, set the senderId for all messages sent on server channels to null
			modelBuilder.Entity<ServerMessage>()
				.HasOne(m => m.Sender)
				.WithMany(u => u.SentServerMessages)
				.HasForeignKey(m => m.SenderId)
				.OnDelete(DeleteBehavior.SetNull);

			// when a channel is deleted, delete its serverMessages
			modelBuilder.Entity<ServerMessage>()
				.HasOne(m => m.Channel)
				.WithMany(c => c.Messages)
				.HasForeignKey(m => m.ChannelId)
				.OnDelete(DeleteBehavior.Cascade);

			// when a server is deleted, delete its channels
			modelBuilder.Entity<Channel>()
				.HasOne(c => c.Server)
				.WithMany(s => s.Channels)
				.HasForeignKey(c => c.ServerId)
				.OnDelete(DeleteBehavior.Cascade);

			// when server creator is deleted, delete their server
			modelBuilder.Entity<Server>()
				.HasOne(c => c.Owner)
				.WithMany(u => u.OwnedServers)
				.HasForeignKey(c => c.OwnerId)
				.OnDelete(DeleteBehavior.Cascade);

			// many to many relationship between users and servers
			modelBuilder.Entity<Server>()
				.HasMany(s => s.Members)
				.WithMany(u => u.JoinedServers)
				.UsingEntity(j => j.ToTable("ServerMembers"));
		}


	}
}
