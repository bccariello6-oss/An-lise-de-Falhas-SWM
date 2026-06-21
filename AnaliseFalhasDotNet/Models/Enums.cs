namespace AnaliseFalhasDotNet.Models
{
    public enum FailureFrequency
    {
        FirstTime,
        Recurring,
        Unknown
    }

    public enum ActionType
    {
        Containment,
        Definitive
    }

    public enum ActionStatus
    {
        Open,
        InProgress,
        Completed
    }
    
    public enum StepId
    {
        Identification = 1,
        W5H1 = 2,
        Details = 3,
        Ishikawa = 4,
        FiveWhys = 5,
        Actions = 6,
        Verification = 7,
        Kanban = 8,
        Dashboard = 9
    }
}
