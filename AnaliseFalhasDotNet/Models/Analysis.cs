using System;
using System.Collections.Generic;

namespace AnaliseFalhasDotNet.Models
{
    public class Analysis
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public int SequentialNumber { get; set; }
        
        // Identificação (Step 1)
        public DateTime? Date { get; set; }
        public TimeSpan? Time { get; set; }
        public string? Equipment { get; set; }
        public string? Area { get; set; }
        public string? Shift { get; set; }
        public string? Team { get; set; }
        public string? Operator { get; set; }
        public string? MaintenanceTech { get; set; }
        
        // 5W1H (Step 2)
        public string? What { get; set; }
        public string? Where { get; set; }
        public string? When { get; set; }
        public string? Who { get; set; }
        public string? How { get; set; }
        public string? HowMuch { get; set; }
        public FailureFrequency? Frequency { get; set; }
        
        // Verificação (Step 3)
        public string? Symptom { get; set; }
        public string? History { get; set; }
        public string? Phenomenon { get; set; }
        public string? MachineStateBefore { get; set; }
        
        // Ishikawa (Step 4)
        public Ishikawa Ishikawa { get; set; } = new Ishikawa();
        
        // 5 Porquês (Step 5)
        public WhysMatrix WhysMatrix { get; set; } = new WhysMatrix();
        public string? RootCause { get; set; }
        
        // Ações (Step 6)
        public List<ActionItem> Actions { get; set; } = new List<ActionItem>();
        
        // Resultados (Step 7)
        public bool? Reoccurred { get; set; }
        public List<ChecklistItem>? VerificationChecklist { get; set; } = new List<ChecklistItem>();
        public string? EffectivenessEvidence { get; set; }
        public List<Attachment>? VerificationAttachments { get; set; } = new List<Attachment>();
        public bool NeedsRevision { get; set; }
        public bool NeedsTraining { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
