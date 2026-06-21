using AnaliseFalhasDotNet.Data;
using AnaliseFalhasDotNet.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AnaliseFalhasDotNet.Services
{
    public class AnalysisService
    {
        private readonly AppDbContext _context;

        public AnalysisService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Analysis>> GetAllAsync()
        {
            return await _context.Analyses.OrderByDescending(a => a.CreatedAt).ToListAsync();
        }

        public async Task<Analysis?> GetByIdAsync(Guid id)
        {
            return await _context.Analyses.FindAsync(id);
        }

        public async Task<Analysis> SaveAsync(Analysis analysis)
        {
            if (analysis.Id == Guid.Empty)
            {
                analysis.Id = Guid.NewGuid();
                // Generate sequential number
                var maxSeq = await _context.Analyses.MaxAsync(a => (int?)a.SequentialNumber) ?? 0;
                analysis.SequentialNumber = maxSeq + 1;
                analysis.CreatedAt = DateTime.UtcNow;
                _context.Analyses.Add(analysis);
            }
            else
            {
                analysis.UpdatedAt = DateTime.UtcNow;
                _context.Analyses.Update(analysis);
            }

            await _context.SaveChangesAsync();
            return analysis;
        }

        public async Task DeleteAsync(Guid id)
        {
            var analysis = await _context.Analyses.FindAsync(id);
            if (analysis != null)
            {
                _context.Analyses.Remove(analysis);
                await _context.SaveChangesAsync();
            }
        }
    }
}
