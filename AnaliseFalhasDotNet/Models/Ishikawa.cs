using System.Collections.Generic;

namespace AnaliseFalhasDotNet.Models
{
    public class Ishikawa
    {
        public List<IshikawaCause> Machine { get; set; } = new List<IshikawaCause>();
        public List<IshikawaCause> Method { get; set; } = new List<IshikawaCause>();
        public List<IshikawaCause> Material { get; set; } = new List<IshikawaCause>();
        public List<IshikawaCause> Manpower { get; set; } = new List<IshikawaCause>();
        public List<IshikawaCause> Measurement { get; set; } = new List<IshikawaCause>();
        public List<IshikawaCause> Environment { get; set; } = new List<IshikawaCause>();
    }

    public class IshikawaCause
    {
        public string Id { get; set; } = System.Guid.NewGuid().ToString();
        public string Text { get; set; } = string.Empty;
        public bool IsSelected { get; set; }
    }
}
