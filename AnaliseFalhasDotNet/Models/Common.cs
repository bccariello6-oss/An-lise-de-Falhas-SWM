using System;

namespace AnaliseFalhasDotNet.Models
{
    public class ChecklistItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Text { get; set; } = string.Empty;
        public bool Checked { get; set; }
    }

    public class Attachment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Url { get; set; } = string.Empty;
    }
}
