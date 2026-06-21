using AnaliseFalhasDotNet.Data;
using AnaliseFalhasDotNet.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Blazored.LocalStorage;

var builder = WebApplication.CreateBuilder(args);

// ── Blazor Server ──
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// ── Entity Framework Core (Azure Database for PostgreSQL) ──
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Authentication (Cookie-based) ──
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login";
        options.LogoutPath = "/logout";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
    });
builder.Services.AddAuthorization();
builder.Services.AddCascadingAuthenticationState();

// ── Application Services ──
builder.Services.AddScoped<AnalysisService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<GeminiService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddBlazoredLocalStorage();
builder.Services.AddHttpClient();

// ── Controllers (API endpoints for auth) ──
builder.Services.AddControllers();

var app = builder.Build();

// ── Middleware Pipeline ──
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseAntiforgery();

app.MapControllers();
app.MapRazorComponents<AnaliseFalhasDotNet.Components.App>()
    .AddInteractiveServerRenderMode();

// ── Auto-migrate on startup (dev convenience) ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    SeedData.Initialize(db);
}

app.Run();
