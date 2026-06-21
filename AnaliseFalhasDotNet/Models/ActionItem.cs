using System;

namespace AnaliseFalhasDotNet.Models
{
    public class ActionItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public ActionType Type { get; set; } = ActionType.Containment;
        public string What { get; set; } = string.Empty;
        public string Who { get; set; } = string.Empty;
        public DateTime? When { get; set; }
        public string Where { get; set; } = string.Empty;
        public string How { get; set; } = string.Empty;
        public string HowMuch { get; set; } = string.Empty;
        public ActionStatus Status { get; set; } = ActionStatus.Open;
    }
}
