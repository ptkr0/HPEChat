using HPEChat_Server.Configuration;
using HPEChat_Server.Data;
using HPEChat_Server.Hubs;
using HPEChat_Server.Initialization;
using HPEChat_Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<ConnectionMapperService>();
builder.Services.AddSignalR();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidateIssuer = true,
			ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
			ValidateAudience = true,
			ValidAudience = builder.Configuration["JwtSettings:Audience"],
			IssuerSigningKey = new SymmetricSecurityKey(
				Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SigningKey"]!)),
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

builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<FileService>();

builder.Services.Configure<FileStorageSettings>(builder.Configuration.GetSection("FileStorageSettings"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

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
