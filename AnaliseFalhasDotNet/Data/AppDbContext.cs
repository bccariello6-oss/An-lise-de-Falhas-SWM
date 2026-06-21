using AnaliseFalhasDotNet.Models;
using Microsoft.EntityFrameworkCore;

namespace AnaliseFalhasDotNet.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Analysis> Analyses { get; set; }
        public DbSet<Profile> Profiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Analysis>(entity =>
            {
                entity.ToTable("swm_failure_analyses");
                entity.HasKey(e => e.Id);
                
                // Using EF Core 8 JSON columns mapping for complex types
                entity.OwnsOne(e => e.WhysMatrix, b => b.ToJson());
                entity.OwnsOne(e => e.Ishikawa, b => b.ToJson());
                entity.OwnsMany(e => e.Actions, b => b.ToJson());
                entity.OwnsMany(e => e.VerificationChecklist, b => b.ToJson());
                entity.OwnsMany(e => e.VerificationAttachments, b => b.ToJson());
            });

            modelBuilder.Entity<Profile>(entity =>
            {
                entity.ToTable("profiles");
                entity.HasKey(e => e.Id);
            });
        }
    }
}
