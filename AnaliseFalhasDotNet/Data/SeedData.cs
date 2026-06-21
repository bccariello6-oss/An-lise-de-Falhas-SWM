using AnaliseFalhasDotNet.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace AnaliseFalhasDotNet.Data
{
    public static class SeedData
    {
        public static void Initialize(AppDbContext context)
        {
            // Opcional: Adicionar dados iniciais para testes
            if (!context.Profiles.Any())
            {
                context.Profiles.Add(new Profile 
                { 
                    Id = Guid.NewGuid(), // Idealmente, GUIDs fariam match com o sistema de Auth
                    Role = "ADMIN", 
                    FullName = "Administrador Sistema", 
                    Username = "admin@swm.local" 
                });
                context.SaveChanges();
            }
        }
    }
}
