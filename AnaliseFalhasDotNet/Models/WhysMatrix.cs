using System;
using System.Collections.Generic;

namespace AnaliseFalhasDotNet.Models
{
    public class WhysMatrix
    {
        public List<WhysRow> Rows { get; set; } = new List<WhysRow>
        {
            new WhysRow() // Initial row A
        };
    }

    public class WhysRow
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Hypothesis { get; set; } = string.Empty;
        public List<WhyCell> Whys { get; set; } = new List<WhyCell>
        {
            new WhyCell(), new WhyCell(), new WhyCell(), new WhyCell(), new WhyCell()
        };
        public string Improvement { get; set; } = string.Empty;
    }

    public class WhyCell
    {
        public string Answer { get; set; } = string.Empty;
        public string? Validated { get; set; } // "V" or "F" or null
        public List<WhySubAnswer> SubAnswers { get; set; } = new List<WhySubAnswer>();
    }

    public class WhySubAnswer
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Text { get; set; } = string.Empty;
        public string? Validated { get; set; }
    }
}
