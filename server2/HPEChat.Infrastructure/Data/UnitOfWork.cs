using HPEChat.Domain.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace HPEChat.Infrastructure.Data
{
	public class UnitOfWork : IUnitOfWork
	{
		private readonly ApplicationDBContext _context;
		private IDbContextTransaction? _currentTransaction;
		public UnitOfWork(ApplicationDBContext context)
		{
			_context = context;
		}
		public async Task BeginTransactionAsync()
		{
			_currentTransaction ??= await _context.Database.BeginTransactionAsync();
		}

		public async Task CommitTransactionAsync()
		{
			try
			{
				await _context.SaveChangesAsync();
				await (_currentTransaction?.CommitAsync() ?? Task.CompletedTask);
			}
			catch
			{
				RollbackTransaction();
				throw;
			}
			finally
			{
				_currentTransaction?.Dispose();
				_currentTransaction = null;
			}
		}

		public void RollbackTransaction()
		{
			try
			{
				_currentTransaction?.Rollback();
			}
			finally
			{
				_currentTransaction?.Dispose();
				_currentTransaction = null;
			}
		}

		public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
		{
			return await _context.SaveChangesAsync(cancellationToken);
		}

		private bool _disposed = false;
		protected virtual void Dispose(bool disposing)
		{
			if (!_disposed)
			{
				if (disposing)
				{
					_context.Dispose();
					_currentTransaction?.Dispose();
				}
				_disposed = true;
			}
		}

		public void Dispose()
		{
			Dispose(true);
			GC.SuppressFinalize(this);
		}
	}
}
