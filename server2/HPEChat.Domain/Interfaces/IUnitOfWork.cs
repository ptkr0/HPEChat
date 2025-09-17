﻿namespace HPEChat.Domain.Interfaces
{
	public interface IUnitOfWork
	{
		Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
		Task BeginTransactionAsync();
		Task CommitTransactionAsync();
		Task RollbackTransactionAsync();
	}
}
