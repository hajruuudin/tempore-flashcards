using Flashcards.Api.Models;
using Flashcards.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Bind MongoDB configuration
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

// Register core Flashcard service as Singleton (MongoClient best practice)
builder.Services.AddSingleton<FlashcardService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Flashcards PWA API", Version = "v1" });
});

// Configure CORS for Next.js frontend and PWA clients
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Utilising swagger for the application documentation.
app.UseSwagger();
app.UseSwaggerUI();

// Application middleware
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

// Dedicated healthcheck route
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();
