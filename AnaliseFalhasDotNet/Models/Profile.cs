using System;

namespace AnaliseFalhasDotNet.Models
{
    public class Profile
    {
        public Guid Id { get; set; }
        public string Role { get; set; } = "USER"; // "ADMIN" or "USER"
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
    }
}
