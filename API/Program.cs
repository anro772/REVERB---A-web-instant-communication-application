using API.Data;
using API.Entities;
using API.Extensions;
using API.Middleware;
using API.SignalR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddIdentityServices(builder.Configuration);

var connString = "";
if (builder.Environment.IsDevelopment())
{
    connString = builder.Configuration.GetConnectionString("DefaultConnection");
}
else
{

    // use connection string for MySql
    //connString = builder.Configuration.GetConnectionString("DefaultConnection");

    //TO REMOVE //

    // Use connection string provided at runtime by FlyIO.
    // var connUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

    // // Parse connection URL to connection string for Npgsql
    // connUrl = connUrl.Replace("postgres://", string.Empty);
    // var pgUserPass = connUrl.Split("@")[0];
    // var pgHostPortDb = connUrl.Split("@")[1];
    // var pgHostPort = pgHostPortDb.Split("/")[0];
    // var pgDb = pgHostPortDb.Split("/")[1];
    // var pgUser = pgUserPass.Split(":")[0];
    // var pgPass = pgUserPass.Split(":")[1];
    // var pgHost = pgHostPort.Split(":")[0];
    // var pgPort = pgHostPort.Split(":")[1];

    // connString = $"Server={pgHost};Port={pgPort};User Id={pgUser};Password={pgPass};Database={pgDb};";
}
builder.Services.AddDbContext<DataContext>(opt =>
{
    //use mysql on user appuser with password 1234
    opt.UseMySql(connString, ServerVersion.AutoDetect(connString));

    //opt.UseNpgsql(connString);
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionMiddleware>();

app.UseCors(builder => builder
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()
    .WithOrigins("https://localhost:4200", "https://localhost:5001"));

app.UseAuthentication();
app.UseAuthorization();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHub<PresenceHub>("hubs/presence");
app.MapHub<MessageHub>("hubs/message");
app.MapHub<NotificationHub>("hubs/notification");
app.MapHub<VideoChatHub>("hubs/videochat");
app.MapHub<GroupMessageHub>("hubs/groupmessage");
app.MapHub<ScreenSharingHub>("hubs/screensharing");
app.MapFallbackToController("Index", "Fallback");

using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;
try
{
    var context = services.GetRequiredService<DataContext>();
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    var roleManager = services.GetRequiredService<RoleManager<AppRole>>();
    await context.Database.MigrateAsync();
    await Seed.ClearConnections(context);
    await Seed.SeedUsers(userManager, roleManager);
}
catch (Exception ex)
{
    var logger = services.GetService<ILogger<Program>>();
    logger.LogError(ex, "An error occurred during migration");
}

app.Run();
