using HPEChat.Domain.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace HPEChat.Infrastructure.Data
{
	public class UnitOfWork : IUnitOfWork, IAsyncDisposable
	{
		private readonly ApplicationDBContext _context;
		private IDbContextTransaction? _currentTransaction;
		private bool _disposed = false;

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
				if (_currentTransaction != null)
				{
					await _currentTransaction.CommitAsync();
				}
			}
			catch
			{
				await RollbackTransactionAsync();
				throw;
			}
			finally
			{
				if (_currentTransaction != null)
				{
					await _currentTransaction.DisposeAsync();
					_currentTransaction = null;
				}
			}
		}

		public async Task RollbackTransactionAsync()
		{
			try
			{
				if (_currentTransaction != null)
				{
					await _currentTransaction.RollbackAsync();
				}
			}
			finally
			{
				if (_currentTransaction != null)
				{
					await _currentTransaction.DisposeAsync();
					_currentTransaction = null;
				}
			}
		}

		public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
		{
			return await _context.SaveChangesAsync(cancellationToken);
		}

		public async ValueTask DisposeAsync()
		{
			if (!_disposed)
			{
				if (_currentTransaction != null)
				{
					await _currentTransaction.DisposeAsync();
					_currentTransaction = null;
				}

				await _context.DisposeAsync();

				_disposed = true;
				GC.SuppressFinalize(this);
			}
		}
	}
}
