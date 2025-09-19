using HPEChat.Api.Hubs;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Repositories;
using HPEChat.Infrastructure.Data;
using HPEChat.Infrastructure.Initializations;
using HPEChat.Infrastructure.Services;
using HPEChat.Domain.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Api.Services;
using HPEChat.Application.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<ConnectionMapperService>();
builder.Services.AddSignalR();

var jwtSettings = builder.Configuration
	.GetSection("JwtSettings")
	.Get<JwtSettings>() ?? throw new InvalidOperationException("JwtSettings configuration is missing or invalid.");

builder.Services.AddSingleton(jwtSettings);
builder.Services.Configure<FileStorageSettings>(builder.Configuration.GetSection("FileStorageSettings"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidateIssuer = true,
			ValidIssuer = jwtSettings.Issuer,
			ValidateAudience = true,
			ValidAudience = jwtSettings.Audience,
			IssuerSigningKey = new SymmetricSecurityKey(
				Encoding.UTF8.GetBytes(jwtSettings.SigningKey)),
		};

		options.Events = new JwtBearerEvents
		{
			OnMessageReceived = context =>
			{
				if (context.Request.Cookies.TryGetValue("Ciasteczko", out var cookieToken))
				{
					context.Token = cookieToken;
				}

				if (string.IsNullOrEmpty(context.Token)
					&& context.Request.Cookies.TryGetValue("Ciasteczko", out cookieToken)
					&& context.HttpContext.WebSockets.IsWebSocketRequest)
				{
					context.Token = cookieToken;
				}
				return Task.CompletedTask;
			}
		};
	});

builder.Services.AddAuthorization();

builder.Services.AddDbContext<ApplicationDBContext>(options =>
	options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
	options.AddPolicy("CorsPolicy",
		policy => policy
			.WithOrigins(
				"http://localhost:5173",
				"https://localhost:5173")
			.AllowCredentials()
			.AllowAnyMethod()
			.AllowAnyHeader());
});

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IServerRepository, ServerRepository>();
builder.Services.AddScoped<IChannelRepository, ChannelRepository>();
builder.Services.AddScoped<IServerMessageRepository, ServerMessageRepository>();

builder.Services.AddScoped<ITokenGenerator, TokenGenerator>();
builder.Services.AddScoped<IServerNotificationService, ServerNotificationService>();
builder.Services.AddScoped<IUserNotificationService, UserNotificationService>();
builder.Services.AddScoped<IFileService, FileService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("CorsPolicy");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapHub<ServerHub>("/hubs/server");
app.MapHub<UserHub>("/hubs/user");

await OwnerInitialization.InitializeAdminAccount(app.Services);

app.Run();
